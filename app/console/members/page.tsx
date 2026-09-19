import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { accentOf } from "@/lib/teams";
import { Dot, day } from "@/components/site";
import type { Access } from "@/lib/types";

export const dynamic = "force-dynamic";

type MemberRow = {
  team_id: string; team_name: string; team_slug: string;
  member_id: string; external_member_id: string;
  member_name: string; department: string | null; email: string | null;
  active: boolean;
  approved_points: number; pending_count: number; total_submissions: number;
  first_seen_at: string; last_event_at: string;
};

export default async function Members() {
  const supabase = await supabaseServer();
  const [{ data: acc }, { data: members }] = await Promise.all([
    supabase.rpc("my_access"),
    supabase.rpc("get_all_members"),
  ]);

  const access = acc as Access | null;
  if (!access?.can_view_all) redirect("/console");

  const rows = (members ?? []) as MemberRow[];

  // Group by team
  const byTeam = rows.reduce<Record<string, MemberRow[]>>((acc, r) => {
    (acc[r.team_slug] ??= []).push(r);
    return acc;
  }, {});

  const teamOrder = ["ascend", "byte-brigade", "cipher", "echo", "nexus"];
  const teams = teamOrder.filter((s) => byTeam[s]);
  // Add any unexpected slugs
  Object.keys(byTeam).forEach((s) => { if (!teams.includes(s)) teams.push(s); });

  const totalActive = rows.filter((r) => r.active).length;
  const totalInactive = rows.filter((r) => !r.active).length;

  return (
    <div className="space-y-10">
      {/* header */}
      <div className="max-w-2xl">
        <div className="label text-mint">MEMBERS</div>
        <h1 className="font-display font-bold text-[40px] sm:text-[54px] leading-none tracking-tight mt-3">
          WHO&rsquo;S IN THE GAME
        </h1>
        <p className="mt-4 text-ash leading-relaxed">
          Everyone central has heard about, across all five teams. A member appears here
          the first time their team sends their record — either as part of a submission or as a
          standalone member sync. Inactive rows are members whose team marked them as deactivated.
        </p>
      </div>

      {/* summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line">
        <Tile k="TEAMS REPORTING" v={String(Object.keys(byTeam).length)} s="of 5" />
        <Tile k="TOTAL MEMBERS" v={String(totalActive)} s="active" />
        <Tile k="INACTIVE" v={String(totalInactive)} s="deactivated by their team" />
        <Tile k="WITH NO SUBMISSIONS" v={String(rows.filter((r) => r.total_submissions === 0).length)} s="joined but not yet submitted" />
      </div>

      {/* per-team sections */}
      {teams.map((slug) => {
        const teamRows = byTeam[slug] ?? [];
        const accent = accentOf(slug);
        const teamName = teamRows[0]?.team_name ?? slug.toUpperCase();
        const active = teamRows.filter((r) => r.active);
        const inactive = teamRows.filter((r) => !r.active);

        return (
          <section key={slug} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-7 flex-none" style={{ background: accent }} />
              <h2 className="font-display font-bold text-[26px] tracking-tight">{teamName}</h2>
              <span className="label ml-2 text-slate">
                {active.length} ACTIVE{inactive.length > 0 ? ` · ${inactive.length} INACTIVE` : ""}
              </span>
            </div>

            {teamRows.length === 0 ? (
              <p className="text-ash text-sm py-4 pl-6 border-l border-line">
                No members have reached central yet. Their team needs to send member events or submit something.
              </p>
            ) : (
              <div className="border border-line">
                {/* active members */}
                {active.map((m) => (
                  <MemberCard key={m.member_id} m={m} accent={accent} />
                ))}
                {/* inactive separator */}
                {inactive.length > 0 && active.length > 0 && (
                  <div className="label px-5 py-2 bg-panel text-slate border-t border-line">
                    INACTIVE
                  </div>
                )}
                {inactive.map((m) => (
                  <MemberCard key={m.member_id} m={m} accent={accent} dim />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* teams with no members yet */}
      {teamOrder.filter((s) => !byTeam[s]).map((slug) => (
        <section key={slug} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-[3px] h-7 flex-none" style={{ background: accentOf(slug) }} />
            <h2 className="font-display font-bold text-[26px] tracking-tight opacity-40">
              {slug.replace("-", " ").toUpperCase()}
            </h2>
            <span className="label ml-2 text-slate">NO MEMBERS YET</span>
          </div>
          <p className="text-ash text-sm pl-6 border-l border-line">
            Nothing received from this team. They need to submit or enable member sync.
          </p>
        </section>
      ))}
    </div>
  );
}

function MemberCard({ m, accent, dim }: { m: MemberRow; accent: string; dim?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] gap-5 px-5 py-4 border-t border-line first:border-t-0 hover:bg-panel transition-colors ${dim ? "opacity-45" : ""}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] leading-tight">{m.member_name}</span>
          {!m.active && <span className="label" style={{ color: "#F0A9A4" }}>INACTIVE</span>}
        </div>
        <div className="mt-1 flex gap-3 flex-wrap">
          {m.department && (
            <span className="label text-slate">{m.department.toUpperCase()}</span>
          )}
          {m.email && (
            <span className="font-mono text-[11px] text-slate">{m.email}</span>
          )}
        </div>
        <div className="mt-2 label">
          {m.total_submissions === 0 ? (
            <span className="text-slate">NO SUBMISSIONS</span>
          ) : (
            <>
              <span>{m.total_submissions} SUBMITTED</span>
              {m.pending_count > 0 && (
                <span className="text-mint"> · {m.pending_count} WAITING</span>
              )}
            </>
          )}
          <span className="text-slate"> · FIRST SEEN {day(m.first_seen_at)}</span>
        </div>
      </div>
      <div className="text-right shrink-0 self-center">
        <div className="figure text-[24px]"
             style={{ color: m.approved_points > 0 ? accent : "#41434A" }}>
          {m.approved_points}
        </div>
        <div className="label mt-0.5 text-slate">PTS</div>
      </div>
    </div>
  );
}

function Tile({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="bg-ink p-5">
      <div className="label">{k}</div>
      <div className="font-display font-bold text-[32px] leading-none tracking-tight mt-3">{v}</div>
      <div className="mt-2 text-[12px] text-slate leading-snug">{s}</div>
    </div>
  );
}
