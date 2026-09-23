import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { accentOf } from "@/lib/types";
import type { Access, ScoreRow } from "@/lib/types";
import { AnalyticsTabs } from "./AnalyticsTabs";
import type { AnalyticsDeep } from "./AnalyticsTabs";

export const dynamic = "force-dynamic";

type Preview = { team_name: string; published_total: number; live_total: number; change: number };

export default async function Analytics() {
  const supabase = await supabaseServer();

  const { data: accessData } = await supabase.rpc("my_access");
  const access = accessData as Access | null;

  if (access?.staff_role !== "em_head" && access?.staff_role !== "secretary") {
    redirect("/console");
  }

  const [scoreRes, previewRes, totalRes, pendingRes, verifiedRes, rejectedRes, deepRes] =
    await Promise.all([
      supabase.rpc("get_scoreboard"),
      supabase.rpc("preview_publish"),
      supabase.from("submissions").select("id", { count: "exact", head: true }),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("team_status", "pending"),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("team_status", "verified"),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("team_status", "rejected"),
      supabase.rpc("analytics_deep"),
    ]);

  const scores  = ((scoreRes.data  ?? []) as ScoreRow[]).sort((a, b) => b.total_points - a.total_points);
  const preview = ((previewRes.data ?? []) as Preview[]);
  const deep    = (deepRes.data ?? {}) as AnalyticsDeep;
  const topScore = scores[0]?.total_points ?? 1;

  const totalSubs    = totalRes.count    ?? 0;
  const pendingSubs  = pendingRes.count  ?? 0;
  const verifiedSubs = verifiedRes.count ?? 0;
  const rejectedSubs = rejectedRes.count ?? 0;

  const totalApproved = scores.reduce((s, t) => s + t.approved_points, 0);
  const totalPending  = scores.reduce((s, t) => s + t.pending_central, 0);
  const totalAdj      = scores.reduce((s, t) => s + t.adjustment_points, 0);
  const drift = preview.some((p) => p.change !== 0);

  return (
    <div className="space-y-14">
      {/* header */}
      <div>
        <div className="label text-mint">ANALYTICS</div>
        <h1 className="font-display font-bold text-[44px] sm:text-[60px] leading-none tracking-tight mt-3">
          HOW IT LOOKS
        </h1>
        <p className="mt-4 max-w-2xl text-ash leading-relaxed">
          Live numbers across all five teams. Unfiltered. Drill into teams, departments, categories, or members below.
        </p>
      </div>

      {/* summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
        <Tile k="TOTAL SUBMISSIONS" v={String(totalSubs)} s="ever received by central" />
        <Tile k="POINTS AWARDED" v={String(totalApproved)} s="across all approved entries" accent />
        <Tile k="WAITING ON CENTRAL" v={String(totalPending)} s="verified by lead, not yet decided" />
        <Tile k="ADJUSTMENTS" v={totalAdj >= 0 ? `+${totalAdj}` : String(totalAdj)} s="net organiser adjustments" />
      </div>

      {/* live vs published drift */}
      <section>
        <h2 className="font-display font-bold text-[26px] tracking-tight">LIVE VS PUBLISHED</h2>
        <p className="mt-1 text-ash text-sm">
          {drift ? "The board is out of date. These are the unpublished changes." : "Published board is current."}
        </p>
        <div className="mt-6 border-t border-line">
          {preview.map((p) => {
            const changed = p.change !== 0;
            return (
              <div key={p.team_name}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-6 items-center border-b border-line py-4">
                <span className="font-display font-bold text-[18px] tracking-tight">{p.team_name}</span>
                <div className="text-right hidden sm:block">
                  <div className="font-mono text-[13px] text-ash">PUBLISHED</div>
                  <div className="font-mono text-[20px] text-slate">{p.published_total}</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="font-mono text-[13px] text-ash">LIVE</div>
                  <div className="font-mono text-[20px] text-bone">{p.live_total}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[13px] text-ash">CHANGE</div>
                  <div className="font-mono text-[20px]"
                    style={{ color: changed ? (p.change > 0 ? "#A7DFDA" : "#F0A9A4") : "#41434A" }}>
                    {p.change > 0 ? `+${p.change}` : p.change === 0 ? "—" : String(p.change)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* submission pipeline */}
      <section>
        <h2 className="font-display font-bold text-[26px] tracking-tight">SUBMISSION PIPELINE</h2>
        <p className="mt-1 text-ash text-sm">Where every submission currently sits across all teams.</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line">
          <PipelineTile label="NOT VERIFIED YET" count={pendingSubs}  total={totalSubs} color="#616264" />
          <PipelineTile label="VERIFIED BY LEAD" count={verifiedSubs} total={totalSubs} color="#A7DFDA" />
          <PipelineTile label="REJECTED BY LEAD" count={rejectedSubs} total={totalSubs} color="#F0A9A4" />
          <PipelineTile label="TOTAL ON RECORD"  count={totalSubs}    total={totalSubs} color="#A49AEA" bold />
        </div>
      </section>

      {/* deep analytics tabs */}
      <section>
        <h2 className="font-display font-bold text-[26px] tracking-tight">DEEP BREAKDOWN</h2>
        <p className="mt-1 text-ash text-sm">Switch between team, category, department, member, and adjustment views.</p>
        <div className="mt-6">
          <AnalyticsTabs data={deep} />
        </div>
      </section>
    </div>
  );
}

function Tile({ k, v, s, accent }: { k: string; v: string; s: string; accent?: boolean }) {
  return (
    <div className="bg-ink p-5">
      <div className={`label ${accent ? "text-mint" : ""}`}>{k}</div>
      <div className="font-display font-bold text-[32px] leading-none tracking-tight mt-3 truncate"
        style={accent ? { color: "#A7DFDA" } : undefined}>{v}</div>
      <div className="mt-2 text-[12px] text-slate leading-snug">{s}</div>
    </div>
  );
}

function PipelineTile({ label, count, total, color, bold }: {
  label: string; count: number; total: number; color: string; bold?: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-ink p-5">
      <div className="label" style={{ color }}>{label}</div>
      <div className="font-display font-bold text-[30px] leading-none tracking-tight mt-3"
        style={bold ? { color } : undefined}>{count}</div>
      <div className="mt-2 text-[12px] text-slate">{pct}% of total</div>
    </div>
  );
}
