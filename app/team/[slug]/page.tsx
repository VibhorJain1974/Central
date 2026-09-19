import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeam, getRoster, getTeamSubs, getBoard } from "@/lib/public";
import { TEAMS, metaOf, CATEGORY_LABEL } from "@/lib/teams";
import {
  SiteHeader, SiteFooter, Section, Empty, TeamArt, TeamLogo, Dot,
  day, stamp, movementText,
} from "@/components/site";

export const revalidate = 60;

export function generateStaticParams() {
  return TEAMS.map((t) => ({ slug: t.slug }));
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = metaOf(slug);
  if (!meta) notFound();

  const [summary, roster, subs, board] = await Promise.all([
    getTeam(slug), getRoster(slug), getTeamSubs(slug), getBoard(),
  ]);

  // A known team always has a page. If central is unreachable or has nothing
  // published, the page renders from what we know locally rather than 404ing,
  // which is what used to happen when the build ran without database access.
  const team = summary ?? {
    id: slug, name: meta.name, slug, rank: null, total_points: 0, movement: 0,
    published_at: null, approved_count: 0, member_count: 0,
    by_category: [], top_activity: null,
  };

  const rows = (board ?? []).slice().sort((a, b) => a.rank - b.rank);
  const leader = rows[0];
  const gap = leader && team.rank ? leader.total_points - team.total_points : 0;
  const catMax = Math.max(1, ...team.by_category.map((c) => c.points));

  return (
    <>
      <SiteHeader active="/teams" />

      {/* ------------------------------------------------------- hero */}
      <section className="relative">
        <div className="relative h-[340px] sm:h-[440px] overflow-hidden">
          <div className="absolute inset-0 kb">
            <TeamArt slug={slug} priority variant="hero" />
          </div>
          <div className="absolute inset-0"
               style={{ background: "linear-gradient(to top, #0B0E13 6%, rgba(11,14,19,0.92) 26%, rgba(11,14,19,0.35) 68%, rgba(11,14,19,0.5))" }} />

          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-[1200px] px-6 pb-9">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                <div className="rise d1"><TeamLogo slug={slug} size={104} /></div>

                <div className="flex-1 min-w-0 rise d2">
                  <div className="label" style={{ color: meta.accent }}>
                    {meta.tagline.toUpperCase()}
                  </div>
                  <h1 className="font-display font-bold text-[52px] sm:text-[84px] leading-[0.84] tracking-tight mt-2">
                    {team.name}
                  </h1>
                </div>

                <div className="flex gap-10 shrink-0 rise d3">
                  <div>
                    <div className="figure text-[40px]">
                      {team.rank ? String(team.rank).padStart(2, "0") : "\u2014"}
                    </div>
                    <div className="label mt-1">RANK</div>
                  </div>
                  <div>
                    <div className="figure text-[40px]" style={{ color: meta.accent }}>
                      {team.total_points}
                    </div>
                    <div className="label mt-1">POINTS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The team's colour, edge to edge, under everything rather than through it. */}
        <div className="h-[3px] wipe d4" style={{ background: meta.accent }} />

        <div className="border-b border-line">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line stagger">
              <Cell k="MOVEMENT" v={movementText(team.movement)} />
              <Cell k="APPROVED ENTRIES" v={String(team.approved_count)} />
              <Cell k="PEOPLE" v={String(team.member_count)} />
              <Cell k={team.rank === 1 ? "LEAD OVER SECOND" : "BEHIND THE LEADER"}
                    v={team.rank === 1
                        ? `+${team.total_points - (rows[1]?.total_points ?? 0)}`
                        : gap ? `-${gap}` : "\u2014"} />
            </div>
            <p className="py-10 max-w-3xl text-ash text-[16px] leading-relaxed rise d5">{meta.blurb}</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- breakdown */}
      <section className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
        <Section n="01" title="WHERE THE POINTS CAME FROM"
                 sub="Every approved entry, grouped by the kind of work it was." />

        {team.by_category.length === 0 ? (
          <Empty title="NOTHING APPROVED YET."
                 body={`${team.name} may already have work verified by its own lead and sitting on central. It counts here once an organiser approves it and a board is signed.`} />
        ) : (
          <div className="space-y-5 stagger">
            {team.by_category
              .slice()
              .sort((a, b) => b.points - a.points)
              .map((c) => (
                <div key={c.category}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="label">{CATEGORY_LABEL[c.category] ?? c.category.toUpperCase()}</span>
                    <span className="font-mono text-[13px] text-ash">
                      {c.count} {c.count === 1 ? "entry" : "entries"}
                      <span className="text-bone"> &middot; {c.points} pts</span>
                    </span>
                  </div>
                  <div className="mt-2 h-[10px] bg-panel border border-line overflow-hidden">
                    <div className="h-full grow"
                         style={{ width: `${(c.points / catMax) * 100}%`, background: meta.accent, opacity: 0.85 }} />
                  </div>
                </div>
              ))}
            {team.top_activity && (
              <p className="pt-3 label">STRONGEST SINGLE ACTIVITY &middot; {team.top_activity.toUpperCase()}</p>
            )}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------- roster */}
      <section className="border-y border-line bg-panel/30">
        <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
          <Section n="02" title="THE ROSTER"
                   sub="Everyone central knows about on this team, and what each has had approved." />

          {!roster || roster.length === 0 ? (
            <Empty title="NO MEMBERS ON RECORD."
                   body="Members appear here automatically the first time their team's database sends anything about them. Nobody types this list by hand." />
          ) : (
            <div className="grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-3 stagger">
              {roster.map((m, i) => (
                <div key={i} className="bg-ink p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[16px] leading-tight truncate">{m.member_name}</h3>
                    <div className="label mt-1.5 text-slate">
                      {m.department ? m.department.toUpperCase() : "—"}
                    </div>
                    <div className="label mt-2">
                      {m.approved_count} {m.approved_count === 1 ? "ENTRY" : "ENTRIES"}
                    </div>
                  </div>
                  <div className="figure text-[28px] shrink-0"
                       style={{ color: m.approved_points ? meta.accent : "#41434A" }}>
                    {m.approved_points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------- submissions */}
      <section className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
        <Section n="03" title="EVERYTHING THAT COUNTED"
                 sub="Each of these was submitted by a member, verified by their lead, sent here automatically, and then approved by an organiser who opened the proof." />

        {!subs || subs.length === 0 ? (
          <Empty title="THE LEDGER IS EMPTY."
                 body="Nothing from this team has been approved and published yet. This page fills itself in the moment that changes." />
        ) : (
          <div className="border-t border-line stagger">
            {subs.map((s) => (
              <article key={s.id}
                       className="grid grid-cols-[1fr_auto] gap-5 border-b border-line py-5 hover:bg-panel transition-colors">
                <div className="min-w-0">
                  <h3 className="text-[16px] leading-snug">{s.title}</h3>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <span className="label" style={{ color: meta.accent }}>{s.activity_label}</span>
                    <span className="label text-slate">{day(s.occurred_on)}</span>
                    {s.member_name && <span className="label text-slate">{s.member_name}</span>}
                    {s.contributors.length > 0 && (
                      <span className="label text-slate">WITH {s.contributors.join(", ").toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="figure text-[26px] shrink-0 self-center">+{s.points}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------- siblings */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="label mb-5">THE OTHER FOUR</div>
          <div className="grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-4 stagger">
            {TEAMS.filter((t) => t.slug !== slug).map((t) => {
              const r = rows.find((x) => x.slug === t.slug);
              return (
                <Link key={t.slug} href={`/team/${t.slug}`} className="group relative bg-ink h-[120px] overflow-hidden">
                  <TeamArt slug={t.slug} className="opacity-45 group-hover:opacity-80 transition-opacity duration-500" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,#0B0E13,transparent 70%)" }} />
                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between">
                    <span className="flex items-center gap-2">
                      <Dot slug={t.slug} size={8} />
                      <span className="font-display font-bold text-[17px] tracking-tight">{t.name}</span>
                    </span>
                    {r && <span className="figure text-[20px]">{r.total_points}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-ink p-5">
      <div className="label">{k}</div>
      <div className="font-display font-bold text-[20px] tracking-tight mt-2">{v}</div>
    </div>
  );
}
