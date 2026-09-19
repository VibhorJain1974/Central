import Link from "next/link";
import { getStats, getBoard, getFeed, getPeople, getTimeline } from "@/lib/public";
import { TEAMS, accentOf, metaOf } from "@/lib/teams";
import {
  SiteHeader, SiteFooter, Section, Empty, TeamArt, TeamLogo, Dot,
  stamp, day, movementText,
} from "@/components/site";
import { RaceChart } from "@/components/RaceChart";

export const revalidate = 60;

export default async function Home() {
  const [stats, board, feed, people, timeline] = await Promise.all([
    getStats(), getBoard(), getFeed(12), getPeople(8), getTimeline(),
  ]);

  const rows = (board ?? []).slice().sort((a, b) => a.rank - b.rank);
  const top = rows[0]?.total_points ?? 0;
  const published = stats?.published_at ?? null;

  return (
    <>
      <SiteHeader active="/" />

      {/* ------------------------------------------------------- hero */}
      <section className="relative border-b border-line overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
             style={{ backgroundImage: "linear-gradient(#A7DFDA 1px,transparent 1px),linear-gradient(90deg,#A7DFDA 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
        <div className="absolute -top-48 -right-48 w-[620px] h-[620px] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(164,154,234,0.18), transparent 68%)" }} />

        <div className="relative mx-auto max-w-[1200px] px-6 pt-20 pb-14 sm:pt-28 sm:pb-16">
          <div className="label rise">TECH SPRINT JOURNEY 2026 &middot; AARVAK &middot; VIPS-TC</div>
          <h1 className="font-display font-bold tracking-tight mt-5 leading-[0.84] text-[58px] sm:text-[92px] lg:text-[124px] rise d1">
            FIVE TEAMS.<br />ONE <span className="text-mint">RECORD.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-ash text-[16px] sm:text-[17px] leading-relaxed rise d2">
            Every team keeps its own site and its own database. What changed is that a
            verified submission now travels here by itself, carrying its proof, within a
            minute. Central re-types nothing, and it publishes a standing only when an
            organiser signs it off.
          </p>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-5 gap-px bg-line border-t border-line stagger">
            <Cell k="TEAMS" v={String(stats?.teams ?? 5)} />
            <Cell k="PEOPLE ON RECORD" v={String(stats?.members ?? 0)} />
            <Cell k="APPROVED ENTRIES" v={String(stats?.approved ?? 0)} />
            <Cell k="POINTS ON THE BOARD" v={String(stats?.points_on_board ?? 0)} accent />
            <Cell k="LAST SIGNED" v={published ? day(published) : "NEVER"} />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- standings */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 sm:py-24">
        <Section n="01" title="THE STANDINGS"
                 sub="A snapshot an organiser signed, not a running total. It can sit behind what a team knows it has earned, and that is deliberate: everyone's number moves at the same instant."
                 right={<Link href="/record" className="label hover:text-bone transition-colors shrink-0">FULL RECORD &rarr;</Link>} />

        {rows.length === 0 ? (
          <Empty title="NOBODY HAS SIGNED A BOARD YET."
                 body="Submissions are arriving and sitting on record. A team's own site may already show points for itself, which is that team's internal count. Nothing appears here until an organiser approves the underlying work and publishes." />
        ) : (
          <div className="border-t border-line stagger">
            {rows.map((r) => {
              const m = metaOf(r.slug);
              return (
                <Link key={r.slug} href={`/team/${r.slug}`}
                      className="group grid grid-cols-[46px_1fr_auto] sm:grid-cols-[76px_92px_1fr_auto] items-center gap-4 sm:gap-7 border-b border-line py-6 sm:py-7 transition-colors hover:bg-panel">
                  <div className="figure text-[40px] sm:text-[58px] text-slate group-hover:text-bone transition-colors">
                    {String(r.rank).padStart(2, "0")}
                  </div>

                  <div className="hidden sm:block">
                    <div className="relative w-[92px] h-[62px] border border-line overflow-hidden">
                      <TeamArt slug={r.slug} className="opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <Dot slug={r.slug} size={10} />
                      <h3 className="font-display font-bold text-[24px] sm:text-[32px] leading-none tracking-tight truncate">
                        {r.team_name}
                      </h3>
                    </div>
                    <div className="mt-2.5 h-[3px] bg-line overflow-hidden">
                      <div className="h-full grow"
                           style={{ width: `${top ? Math.max(2, (r.total_points / top) * 100) : 2}%`, background: accentOf(r.slug) }} />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="label">{movementText(r.movement)}</span>
                      {m && <span className="label hidden md:inline text-slate">{m.tagline}</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="figure text-[36px] sm:text-[54px]">{r.total_points}</div>
                    <div className="label mt-1">POINTS</div>
                  </div>
                </Link>
              );
            })}
            <p className="mt-6 label">SIGNED {stamp(published)} &middot; MOVEMENT IS AGAINST THE PREVIOUS BOARD</p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------ race */}
      {timeline && timeline.length > 0 && (
        <section className="border-y border-line bg-panel/30">
          <div className="mx-auto max-w-[1200px] px-6 py-20 sm:py-24">
            <Section n="02" title="THE RACE"
                     sub="Every board ever signed, in order. Flat stretches are weeks nobody published, not weeks nobody worked." />
            <RaceChart rows={timeline} />
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ feed */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 sm:py-24">
        <Section n={timeline && timeline.length ? "03" : "02"} title="WHAT JUST COUNTED"
                 sub="The most recent work an organiser approved, across all five teams."
                 right={<Link href="/record" className="label hover:text-bone transition-colors shrink-0">EVERYTHING &rarr;</Link>} />

        {!feed || feed.length === 0 ? (
          <Empty title="NOTHING HAS BEEN APPROVED YET."
                 body="Verified submissions are queued on central waiting for a decision. The moment an organiser approves one and publishes, it shows up here with the team and the person who did it." />
        ) : (
          <div className="grid gap-px bg-line border border-line md:grid-cols-2 stagger">
            {feed.map((f, i) => (
              <article key={i} className="bg-ink p-5 hover:bg-panel transition-colors">
                <div className="flex items-center gap-2.5">
                  <Dot slug={f.team_slug} size={8} />
                  <Link href={`/team/${f.team_slug}`} className="label hover:text-bone transition-colors">{f.team_name}</Link>
                  <span className="ml-auto font-mono text-[13px] text-mint">+{f.points}</span>
                </div>
                <h3 className="mt-2.5 text-[15px] leading-snug">{f.title}</h3>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <span className="label">{f.activity_label}</span>
                  {f.member_name && <span className="label text-slate">{f.member_name}</span>}
                  <span className="label text-slate">{day(f.occurred_on)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------- teams */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-20 sm:py-24">
          <Section n={timeline && timeline.length ? "04" : "03"} title="THE FIVE"
                   sub="Different stacks, different habits, different ideas of what a good week looks like. One catalog and one set of rules." />

          <div className="grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-3 stagger">
            {TEAMS.map((t) => {
              const row = rows.find((r) => r.slug === t.slug);
              return (
                <Link key={t.slug} href={`/team/${t.slug}`} className="group relative bg-ink overflow-hidden">
                  <div className="relative h-[190px] overflow-hidden">
                    <TeamArt slug={t.slug} className="opacity-70 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0B0E13 4%, rgba(11,14,19,0.2) 55%, transparent)" }} />
                    {row && (
                      <div className="absolute top-3 right-3 font-mono text-[10px] tracking-[0.16em] bg-ink/80 border border-line px-2 py-1">
                        RANK {String(row.rank).padStart(2, "0")}
                      </div>
                    )}
                  </div>
                  <div className="relative p-5 -mt-10">
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Dot slug={t.slug} size={10} />
                        <h3 className="font-display font-bold text-[24px] leading-none tracking-tight">{t.name}</h3>
                      </div>
                      {row && <div className="figure text-[28px]">{row.total_points}</div>}
                    </div>
                    <p className="mt-3 text-[13px] text-ash leading-relaxed">{t.blurb}</p>
                    <div className="mt-4 h-[2px] w-0 group-hover:w-full transition-[width] duration-500"
                         style={{ background: t.accent }} />
                  </div>
                </Link>
              );
            })}

            <div className="bg-ink p-5 flex flex-col justify-between">
              <div>
                <div className="label text-mint">HOW A POINT GETS HERE</div>
                <ol className="mt-4 space-y-3">
                  {[
                    "A member submits on their own team's site, with the proof attached.",
                    "Their team lead checks it is real and marks it verified.",
                    "It travels to central by itself within a minute, proof and all.",
                    "An organiser opens the proof here and approves it.",
                    "Nothing is public until a board is signed.",
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-[11px] text-lav pt-[3px]">{i + 1}</span>
                      <span className="text-[13px] text-ash leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <Link href="/rules" className="label hover:text-bone transition-colors mt-6">READ THE RULES &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- people */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-20 sm:py-24">
          <Section n={timeline && timeline.length ? "05" : "04"} title="THE PEOPLE DOING IT"
                   sub="Teams score, but people submit. This is who is actually carrying the weight."
                   right={<Link href="/people" className="label hover:text-bone transition-colors shrink-0">FULL LIST &rarr;</Link>} />

          {!people || people.length === 0 ? (
            <Empty title="NO INDIVIDUAL RECORD YET."
                   body="This fills in as submissions get approved. Every approved entry is credited to the person who submitted it, and anyone else named on it is listed alongside." />
          ) : (
            <div className="grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-4 stagger">
              {people.map((p, i) => (
                <div key={i} className="bg-ink p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="figure text-[26px] text-slate">{String(i + 1).padStart(2, "0")}</span>
                    <span className="figure text-[26px]">{p.points}</span>
                  </div>
                  <h3 className="mt-3 text-[16px] leading-tight">{p.member_name}</h3>
                  <Link href={`/team/${p.team_slug}`} className="mt-2 flex items-center gap-2 label hover:text-bone transition-colors">
                    <Dot slug={p.team_slug} size={6} />{p.team_name}
                  </Link>
                  <div className="label mt-3 text-slate">{p.entries} ENTRIES</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Cell({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-ink py-5 pr-4">
      <div className="label">{k}</div>
      <div className={`font-display font-bold text-[22px] sm:text-[26px] tracking-tight mt-2 ${accent ? "text-mint" : ""}`}>{v}</div>
    </div>
  );
}
