import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { metaOf, CATEGORY_LABEL } from "@/lib/teams";
import { TeamArt, TeamLogo, day, stamp } from "@/components/site";
import type { Access } from "@/lib/types";

export const dynamic = "force-dynamic";

type Overview = {
  team_id: string; name: string; slug: string;
  live_points: number; approved_points: number; adjustment_points: number;
  counts: { total: number; approved: number; waiting: number; needs_info: number;
            rejected: number; revoked: number; unverified: number };
  members: number;
  by_category: { category: string; points: number; count: number }[];
  published: { rank: number; points: number; at: string } | null;
};

type Sub = {
  id: string; title: string; activity_label: string; points: number;
  occurred_on: string; team_status: string; central_status: string;
  central_note: string | null; member_name: string | null;
  first_seen_at: string; decided_at: string | null;
};

type Member = {
  member_name: string; department: string | null; email: string | null;
  active: boolean; approved_points: number; waiting: number; total: number;
};

export default async function MyTeam() {
  const supabase = await supabaseServer();
  const [{ data: acc }, { data: ov }, { data: subs }, { data: roster }] = await Promise.all([
    supabase.rpc("my_access"),
    supabase.rpc("my_team_overview"),
    supabase.rpc("my_team_submissions", { p_limit: 300 }),
    supabase.rpc("my_team_roster"),
  ]);

  const access = acc as Access | null;
  if (!access?.lead_of) redirect("/console");

  const o = ov as Overview | null;
  const rows = (subs ?? []) as Sub[];
  const people = (roster ?? []) as Member[];
  const meta = o ? metaOf(o.slug) : undefined;
  const accent = meta?.accent ?? "#A49AEA";
  const catMax = Math.max(1, ...(o?.by_category ?? []).map((c) => c.points));

  return (
    <div className="space-y-12">
      {/* --------------------------------------------------------- head */}
      <div className="relative border border-line overflow-hidden">
        <div className="relative h-[150px]">
          {o && <TeamArt slug={o.slug} className="opacity-50" />}
          <div className="absolute inset-0"
               style={{ background: "linear-gradient(to top,#0B0E13 8%,rgba(11,14,19,0.75) 45%,rgba(11,14,19,0.3))" }} />
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-end gap-4 w-full">
              {o && <div className="rise"><TeamLogo slug={o.slug} size={62} /></div>}
              <div className="flex-1 min-w-0 rise d1">
                <div className="label" style={{ color: accent }}>YOUR TEAM</div>
                <h1 className="font-display font-bold text-[34px] leading-none tracking-tight mt-1.5">
                  {o?.name ?? access.lead_team_name}
                </h1>
              </div>
              {o && (
                <Link href={`/team/${o.slug}`}
                      className="label hover:text-bone transition-colors shrink-0">PUBLIC PAGE &rarr;</Link>
              )}
            </div>
          </div>
        </div>
        <div className="h-[2px] wipe d2" style={{ background: accent }} />
      </div>

      {/* --------------------------------------------------------- tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line stagger">
        <Tile k="LIVE TOTAL" v={String(o?.live_points ?? 0)} s="approved plus adjustments, right now" accent={accent} />
        <Tile k="ON THE PUBLIC BOARD" v={String(o?.published?.points ?? 0)}
              s={o?.published ? `rank ${o.published.rank} · signed ${day(o.published.at)}` : "nothing published yet"} />
        <Tile k="WAITING ON ORGANISERS" v={String(o?.counts.waiting ?? 0)} s="you verified it, central has not decided" />
        <Tile k="NOT YET VERIFIED BY YOU" v={String(o?.counts.unverified ?? 0)} s="sitting on your own site" />
      </div>

      {(o?.counts.needs_info ?? 0) > 0 && (
        <div className="panel p-5 border-l-2 border-mint">
          <div className="label text-mint">ACTION NEEDED</div>
          <p className="mt-2 text-sm text-ash leading-relaxed">
            {o!.counts.needs_info} submission{o!.counts.needs_info > 1 ? "s" : ""} came back asking for more.
            Look for the amber rows below, read the note, and get the member to resubmit with better proof.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- breakdown */}
      <section>
        <h2 className="font-display font-bold text-[26px] tracking-tight">WHERE YOUR POINTS CAME FROM</h2>
        {!o || o.by_category.length === 0 ? (
          <p className="mt-4 text-ash text-sm">Nothing approved yet, so there is nothing to break down.</p>
        ) : (
          <div className="mt-6 space-y-4 stagger">
            {o.by_category.slice().sort((a, b) => b.points - a.points).map((c) => (
              <div key={c.category}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="label">{CATEGORY_LABEL[c.category] ?? c.category.toUpperCase()}</span>
                  <span className="font-mono text-[12px] text-ash">
                    {c.count} &middot; <span className="text-bone">{c.points} pts</span>
                  </span>
                </div>
                <div className="mt-2 h-[9px] bg-panel border border-line overflow-hidden">
                  <div className="h-full grow" style={{ width: `${(c.points / catMax) * 100}%`, background: accent, opacity: 0.85 }} />
                </div>
              </div>
            ))}
            {o.adjustment_points !== 0 && (
              <p className="label pt-2">
                INCLUDES {o.adjustment_points > 0 ? "+" : ""}{o.adjustment_points} FROM ORGANISER ADJUSTMENTS
              </p>
            )}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------- roster */}
      <section>
        <h2 className="font-display font-bold text-[26px] tracking-tight">YOUR PEOPLE</h2>
        <p className="mt-2 text-ash text-sm">
          Central learns about members automatically from your database. You never type this list.
        </p>
        <div className="mt-6 grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-3 stagger">
          {people.length === 0 && (
            <div className="bg-ink p-5 text-ash text-sm">Nobody has reached central yet.</div>
          )}
          {people.map((m, i) => (
            <div key={i} className={`bg-ink p-5 flex items-start justify-between gap-4 ${m.active ? "" : "opacity-45"}`}>
              <div className="min-w-0">
                <h3 className="text-[15px] leading-tight truncate">{m.member_name}</h3>
                <div className="label mt-1 text-slate">{m.department?.toUpperCase() ?? "—"}</div>
                <div className="label mt-2">
                  {m.total} SUBMITTED{m.waiting > 0 && <span className="text-mint"> &middot; {m.waiting} WAITING</span>}
                  {!m.active && <span className="text-[#F0A9A4]"> &middot; INACTIVE</span>}
                </div>
              </div>
              <div className="figure text-[24px] shrink-0" style={{ color: m.approved_points ? accent : "#41434A" }}>
                {m.approved_points}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- submissions */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display font-bold text-[26px] tracking-tight">EVERY SUBMISSION</h2>
          <span className="label">{rows.length} TOTAL</span>
        </div>
        <p className="mt-2 text-ash text-sm">
          Everything your team has ever sent, and exactly where each one stands.
        </p>

        <div className="mt-6 border-t border-line stagger">
          {rows.length === 0 && <p className="py-8 text-ash text-sm">Nothing has reached central from your team yet.</p>}
          {rows.map((s) => (
            <article key={s.id}
                     className="grid grid-cols-[1fr_auto] gap-5 border-b border-line py-4 hover:bg-panel transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <Status team={s.team_status} central={s.central_status} />
                  <span className="label" style={{ color: accent }}>{s.activity_label}</span>
                </div>
                <h3 className="mt-1.5 text-[15px] leading-snug">{s.title}</h3>
                <div className="mt-1.5 flex gap-3 flex-wrap">
                  {s.member_name && <span className="label text-slate">{s.member_name}</span>}
                  <span className="label text-slate">{day(s.occurred_on)}</span>
                  {s.decided_at && <span className="label text-slate">DECIDED {day(s.decided_at)}</span>}
                </div>
                {s.central_note && (
                  <p className="mt-2 border-l-2 border-line pl-3 text-[13px] text-ash leading-relaxed">
                    {s.central_note}
                  </p>
                )}
              </div>
              <div className="figure text-[22px] shrink-0 self-center"
                   style={{ color: s.central_status === "approved" ? accent : "#41434A" }}>
                {s.central_status === "approved" ? `+${s.points}` : s.points}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({ k, v, s, accent }: { k: string; v: string; s: string; accent?: string }) {
  return (
    <div className="bg-ink p-5">
      <div className="label">{k}</div>
      <div className="font-display font-bold text-[32px] leading-none tracking-tight mt-3"
           style={accent ? { color: accent } : undefined}>{v}</div>
      <div className="mt-2 text-[12px] text-slate leading-snug">{s}</div>
    </div>
  );
}

function Status({ team, central }: { team: string; central: string }) {
  const map: Record<string, [string, string]> = {
    approved:   ["APPROVED", "#A7DFDA"],
    pending:    ["WAITING ON CENTRAL", "#999B9C"],
    needs_info: ["NEEDS MORE", "#E8A33C"],
    rejected:   ["REJECTED", "#F0A9A4"],
    revoked:    ["REVOKED", "#F0A9A4"],
  };
  if (team === "pending") return <span className="label" style={{ color: "#616264" }}>NOT VERIFIED BY YOU</span>;
  if (team === "rejected") return <span className="label" style={{ color: "#F0A9A4" }}>YOU REJECTED IT</span>;
  const [label, colour] = map[central] ?? ["UNKNOWN", "#616264"];
  return <span className="label" style={{ color: colour }}>{label}</span>;
}
