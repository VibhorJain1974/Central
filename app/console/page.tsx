import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { accentOf, type ScoreRow, type BoardRow, type Access } from "@/lib/types";

export const dynamic = "force-dynamic";

type Preview = { team_name: string; published_total: number; live_total: number; change: number };

export default async function Overview() {
  const supabase = await supabaseServer();

  const [accessRes, scoreRes, boardRes, previewRes, subCount, pendCount] = await Promise.all([
    supabase.rpc("my_access"),
    supabase.rpc("get_scoreboard"),
    supabase.rpc("get_leaderboard"),
    supabase.rpc("preview_publish"),
    supabase.from("submissions").select("id", { count: "exact", head: true }),
    supabase.from("submissions").select("id", { count: "exact", head: true })
      .eq("team_status", "verified").eq("central_status", "pending"),
  ]);

  const access = (accessRes.data ?? null) as Access | null;

  // A team lead has no business on the society-wide overview: they cannot
  // approve, publish or see other teams. Send them to their own team instead.
  if (access?.lead_of && !access.can_view_all && !access.can_approve) {
    redirect("/console/team");
  }
  const score = ((scoreRes.data ?? []) as ScoreRow[]).sort((a, b) => b.total_points - a.total_points);
  const board = ((boardRes.data ?? []) as BoardRow[]);
  const preview = ((previewRes.data ?? []) as Preview[]);
  const drift = preview.some((p) => p.change !== 0);
  const top = score[0]?.total_points ?? 0;

  return (
    <div className="space-y-12">
      <div>
        <div className="label text-mint">CONSOLE</div>
        <h1 className="font-display font-bold text-[44px] sm:text-[60px] leading-none tracking-tight mt-3">
          THE LIVE COUNT
        </h1>
        <p className="mt-4 max-w-2xl text-ash leading-relaxed">
          This is what central holds right now: approved submissions plus adjustments.
          It is not what the public sees. The public sees the last published board, and
          the two only match in the moment after someone publishes.
        </p>
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Tile k="WAITING ON YOU" v={String(pendCount.count ?? 0)}
              s="verified by a lead, not yet decided here" accent />
        <Tile k="ON RECORD" v={String(subCount.count ?? 0)} s="submissions central has ever seen" />
        <Tile k="PUBLISHED BOARD" v={board.length ? board[0].team_name : "NONE YET"}
              s={board.length ? "currently ranked first" : "nothing has been published"} />
        <Tile k="DRIFT" v={drift ? "YES" : "NONE"}
              s={drift ? "live count differs from the published board" : "published board is current"} />
      </div>

      {drift && access?.can_publish && (
        <div className="panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-ash leading-relaxed max-w-2xl">
            The live count has moved since the last publish. Teams cannot see any of it
            until you sign off a new board.
          </p>
          <Link href="/console/publish"
                className="font-mono text-[10px] tracking-[0.18em] bg-bone text-ink px-4 py-2.5 hover:bg-mint transition-colors shrink-0 text-center">
            REVIEW AND PUBLISH
          </Link>
        </div>
      )}

      <section>
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="font-display font-bold text-[28px] tracking-tight">STANDING, UNPUBLISHED</h2>
          <Link href="/console/review" className="label hover:text-bone transition-colors">GO TO REVIEW &rarr;</Link>
        </div>

        <div className="mt-6 border-t border-line">
          {score.length === 0 && <p className="py-8 text-ash text-sm">No teams are reporting yet.</p>}
          {score.map((t, i) => (
            <div key={t.team_id}
                 className="grid grid-cols-[40px_1fr_auto] sm:grid-cols-[52px_1fr_repeat(3,minmax(78px,auto))] items-center gap-4 sm:gap-6 border-b border-line py-5">
              <div className="figure text-[30px] text-slate">{String(i + 1).padStart(2, "0")}</div>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <i className="w-[9px] h-[9px] shrink-0" style={{ background: accentOf(t.slug) }} />
                  <span className="font-display font-bold text-[20px] tracking-tight truncate">{t.name}</span>
                  {t.pending_central > 0 && (
                    <span className="label text-mint whitespace-nowrap">{t.pending_central} WAITING</span>
                  )}
                </div>
                <div className="mt-2 h-[3px] bg-line overflow-hidden">
                  <div className="h-full" style={{ width: `${top ? Math.max(2, (t.total_points / top) * 100) : 2}%`, background: accentOf(t.slug) }} />
                </div>
              </div>

              <Cell k="APPROVED" v={t.approved_points} className="hidden sm:block" />
              <Cell k="ADJUSTED" v={t.adjustment_points} signed className="hidden sm:block" />
              <div className="text-right">
                <div className="figure text-[30px]">{t.total_points}</div>
                <div className="label mt-0.5">TOTAL</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({ k, v, s, accent }: { k: string; v: string; s: string; accent?: boolean }) {
  return (
    <div className="bg-ink p-5">
      <div className={`label ${accent ? "text-mint" : ""}`}>{k}</div>
      <div className="font-display font-bold text-[32px] leading-none tracking-tight mt-3 truncate">{v}</div>
      <div className="mt-2 text-[12px] text-slate leading-snug">{s}</div>
    </div>
  );
}

function Cell({ k, v, signed, className = "" }: { k: string; v: number; signed?: boolean; className?: string }) {
  const txt = signed && v > 0 ? `+${v}` : String(v);
  return (
    <div className={`text-right ${className}`}>
      <div className={`font-mono text-[14px] ${signed && v !== 0 ? (v > 0 ? "text-mint" : "text-[#F0A9A4]") : "text-ash"}`}>{txt}</div>
      <div className="label mt-0.5">{k}</div>
    </div>
  );
}
