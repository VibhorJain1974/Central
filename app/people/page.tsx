import Link from "next/link";
import { getPeople } from "@/lib/public";
import { SiteHeader, SiteFooter, Section, Empty, Dot } from "@/components/site";
import { accentOf } from "@/lib/teams";

export const revalidate = 60;

export default async function People() {
  const people = await getPeople(200);
  const rows = people ?? [];
  const top = rows[0]?.points ?? 0;

  return (
    <>
      <SiteHeader active="/people" />
      <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
        <Section title="THE PEOPLE"
                 sub="Teams take the trophy, but individuals do the work. Every approved entry is credited to whoever submitted it. Anyone else named on a submission is listed on it, but the points sit with the submitter." />

        {rows.length === 0 ? (
          <Empty title="NOBODY IS ON THE INDIVIDUAL BOARD YET."
                 body="This ranks people by approved, published points. It fills in as organisers work through the queue and sign a board." />
        ) : (
          <div className="border-t border-line stagger">
            {rows.map((p, i) => (
              <div key={i}
                   className="grid grid-cols-[42px_1fr_auto] sm:grid-cols-[56px_1fr_150px_auto] items-center gap-4 sm:gap-6 border-b border-line py-4 hover:bg-panel transition-colors">
                <div className="figure text-[24px] sm:text-[30px] text-slate">{String(i + 1).padStart(2, "0")}</div>

                <div className="min-w-0">
                  <div className="text-[15px] sm:text-[17px] truncate">{p.member_name}</div>
                  <div className="mt-1.5 h-[2px] bg-line overflow-hidden max-w-xs">
                    <div className="h-full" style={{ width: `${top ? Math.max(3, (p.points / top) * 100) : 3}%`, background: accentOf(p.team_slug) }} />
                  </div>
                </div>

                <Link href={`/team/${p.team_slug}`}
                      className="hidden sm:flex items-center gap-2 label hover:text-bone transition-colors">
                  <Dot slug={p.team_slug} size={7} />{p.team_name}
                </Link>

                <div className="text-right">
                  <div className="figure text-[24px]">{p.points}</div>
                  <div className="label mt-0.5">{p.entries} ENTRIES</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
