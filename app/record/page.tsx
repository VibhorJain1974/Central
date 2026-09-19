import Link from "next/link";
import { getFeed, getTimeline, getStats } from "@/lib/public";
import { SiteHeader, SiteFooter, Section, Empty, Dot, day, stamp } from "@/components/site";
import { RaceChart } from "@/components/RaceChart";
import { metaOf } from "@/lib/teams";

export const revalidate = 60;

export default async function Record() {
  const [feed, timeline, stats] = await Promise.all([getFeed(200), getTimeline(), getStats()]);
  const rows = feed ?? [];
  const tl = timeline ?? [];

  // Every board that was ever signed, newest first.
  const pubs = Array.from(new Set(tl.map((r) => r.published_at))).sort().reverse();

  return (
    <>
      <SiteHeader active="/record" />
      <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
        <Section title="THE RECORD"
                 sub="Everything central has approved and published, and every board that was ever signed. Nothing here can be quietly edited: a correction is a new entry, and a reversal leaves both visible." />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line mb-16 stagger">
          <Cell k="BOARDS SIGNED" v={String(stats?.publications ?? 0)} />
          <Cell k="APPROVED ENTRIES" v={String(stats?.approved ?? 0)} />
          <Cell k="POINTS ON THE BOARD" v={String(stats?.points_on_board ?? 0)} />
          <Cell k="LAST SIGNED" v={stats?.published_at ? day(stats.published_at) : "NEVER"} />
        </div>

        {tl.length > 0 && (
          <div className="mb-20">
            <h2 className="font-display font-bold text-[30px] tracking-tight mb-6">THE RACE</h2>
            <RaceChart rows={tl} />
          </div>
        )}

        {pubs.length > 0 && (
          <div className="mb-20">
            <h2 className="font-display font-bold text-[30px] tracking-tight mb-6">EVERY BOARD</h2>
            <div className="space-y-px bg-line border border-line stagger">
              {pubs.map((at) => {
                const entries = tl.filter((r) => r.published_at === at).sort((a, b) => a.rank - b.rank);
                const note = entries[0]?.note;
                return (
                  <div key={at} className="bg-ink p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="seal text-[11px]">{stamp(at)}</span>
                      {note && <span className="text-[13px] text-ash">{note}</span>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                      {entries.map((e) => (
                        <Link key={e.team_slug} href={`/team/${e.team_slug}`}
                              className="flex items-baseline gap-2.5 group">
                          <span className="font-mono text-[11px] text-slate">{String(e.rank).padStart(2, "0")}</span>
                          <Dot slug={e.team_slug} size={7} />
                          <span className="label group-hover:text-bone transition-colors">{e.team_name}</span>
                          <span className="font-mono text-[13px] text-bone">{e.total_points}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="font-display font-bold text-[30px] tracking-tight mb-6">EVERY APPROVAL</h2>
        {rows.length === 0 ? (
          <Empty title="NOTHING HAS BEEN APPROVED YET."
                 body="Verified work is queued on central waiting for a decision. Every approval will appear here, in the order it was decided, permanently." />
        ) : (
          <div className="border-t border-line">
            {rows.map((f, i) => (
              <article key={i}
                       className="grid grid-cols-[1fr_auto] gap-5 border-b border-line py-4 hover:bg-panel transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Dot slug={f.team_slug} size={7} />
                    <Link href={`/team/${f.team_slug}`} className="label hover:text-bone transition-colors">
                      {f.team_name}
                    </Link>
                    <span className="label text-slate" style={{ color: metaOf(f.team_slug)?.accent }}>
                      {f.activity_label}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-[15px] leading-snug">{f.title}</h3>
                  <div className="mt-1.5 flex gap-3 flex-wrap">
                    {f.member_name && <span className="label text-slate">{f.member_name}</span>}
                    <span className="label text-slate">DONE {day(f.occurred_on)}</span>
                    <span className="label text-slate">APPROVED {day(f.decided_at)}</span>
                  </div>
                </div>
                <div className="figure text-[24px] shrink-0 self-center">+{f.points}</div>
              </article>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-ink p-5">
      <div className="label">{k}</div>
      <div className="font-display font-bold text-[24px] tracking-tight mt-2">{v}</div>
    </div>
  );
}
