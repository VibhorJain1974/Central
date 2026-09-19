import Link from "next/link";
import { getBoard } from "@/lib/public";
import { TEAMS } from "@/lib/teams";
import { SiteHeader, SiteFooter, Section, TeamArt, TeamLogo, Dot, movementText } from "@/components/site";

export const revalidate = 60;

export default async function Teams() {
  const board = await getBoard();
  const rows = (board ?? []).slice().sort((a, b) => a.rank - b.rank);

  return (
    <>
      <SiteHeader active="/teams" />
      <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
        <Section title="THE FIVE"
                 sub="One society, five teams, seventy-five days. Each keeps its own site and its own database, and every one of them reports here." />

        <div className="space-y-px bg-line border border-line stagger">
          {TEAMS.map((t) => {
            const r = rows.find((x) => x.slug === t.slug);
            return (
              <Link key={t.slug} href={`/team/${t.slug}`}
                    className="group relative bg-ink block overflow-hidden">
                <div className="relative h-[220px] sm:h-[250px]">
                  <TeamArt slug={t.slug} className="kb opacity-60 group-hover:opacity-95 group-hover:scale-[1.03] transition-all duration-700" />
                  <div className="absolute inset-0"
                       style={{ background: "linear-gradient(90deg, #0B0E13 18%, rgba(11,14,19,0.75) 48%, rgba(11,14,19,0.25))" }} />

                  <div className="relative h-full flex items-center gap-6 sm:gap-10 px-6 sm:px-10">
                    <div className="hidden sm:block"><TeamLogo slug={t.slug} size={96} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <Dot slug={t.slug} size={10} />
                        <span className="label" style={{ color: t.accent }}>{t.tagline.toUpperCase()}</span>
                      </div>
                      <h2 className="font-display font-bold text-[34px] sm:text-[50px] leading-none tracking-tight mt-2">
                        {t.name}
                      </h2>
                      <p className="mt-3 max-w-xl text-[13.5px] text-ash leading-relaxed hidden sm:block">{t.blurb}</p>
                    </div>
                    {r && (
                      <div className="text-right shrink-0">
                        <div className="figure text-[38px] sm:text-[52px]">{r.total_points}</div>
                        <div className="label mt-1">RANK {String(r.rank).padStart(2, "0")}</div>
                        <div className="label mt-0.5 text-slate">{movementText(r.movement)}</div>
                      </div>
                    )}
                  </div>
                  <div className="absolute left-0 bottom-0 h-[3px] w-0 group-hover:w-full transition-[width] duration-700"
                       style={{ background: t.accent }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
