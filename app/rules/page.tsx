import { getCatalog } from "@/lib/public";
import { SiteHeader, SiteFooter, Section } from "@/components/site";
import { CATEGORY_LABEL } from "@/lib/teams";

export const revalidate = 300;

export default async function Rules() {
  const catalog = (await getCatalog()) ?? [];
  const cats = ["sprint_track", "team_activity", "individual", "bonus"];

  return (
    <>
      <SiteHeader active="/rules" />
      <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
        <Section title="THE RULES"
                 sub="One catalog for all five teams. A team may call an activity something else inside its own system; central translates it, so nobody is ever scored against a different sheet." />

        <div className="grid gap-px bg-line border border-line lg:grid-cols-4 mb-20 stagger">
          {[
            ["A MEMBER SUBMITS", "On their own team's site, with the certificate, the merged pull request or the screenshot attached. Central never asks anyone to upload anything twice."],
            ["THEIR LEAD VERIFIES", "The team lead confirms it is real. Until they do it never leaves the team's database, so a mistaken submission never reaches the organisers."],
            ["IT TRAVELS BY ITSELF", "Within a minute the team's database sends it here, proof and all. If central is unreachable it keeps retrying. Nobody presses anything."],
            ["AN ORGANISER DECIDES", "They open the proof here and approve or reject it. Only approved work counts, and only a signed board is public."],
          ].map(([t, b], i) => (
            <div key={i} className="bg-ink p-6">
              <div className="figure text-[40px] text-lav">{i + 1}</div>
              <h3 className="font-display font-bold text-[18px] tracking-tight mt-3">{t}</h3>
              <p className="mt-3 text-[13px] text-ash leading-relaxed">{b}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-10 md:grid-cols-3 mb-20">
          {[
            ["PROOF IS HELD, NOT PROMISED", "Every proof on central resolves to a file that actually opens. An organiser never has to ask a team to send a certificate over WhatsApp to check a claim."],
            ["PLAGIARISM COSTS NINE TENTHS", "If work is found to be copied after the fact, the submission is revoked and the team keeps exactly ten percent of what that activity was worth. The record shows both the award and the revocation."],
            ["ADJUSTMENTS ARE SIGNED", "An organiser can add or remove points outside the catalog, but never anonymously. Every adjustment carries a written reason, and reversing one leaves both entries on the record."],
          ].map(([t, b], i) => (
            <div key={i} className="border-l-2 border-mint pl-4">
              <div className="label text-mint">{t}</div>
              <p className="mt-2 text-[13.5px] text-ash leading-relaxed">{b}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display font-bold text-[34px] tracking-tight mb-2">WHAT EARNS POINTS</h2>
        <p className="text-ash mb-10">{catalog.length} active activities, straight from central.</p>

        <div className="space-y-12">
          {cats.map((cat) => {
            const items = catalog.filter((c) => c.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <div className="label text-mint">{CATEGORY_LABEL[cat] ?? cat.toUpperCase()}</div>
                <div className="mt-4 border-t border-line">
                  {items.map((c) => (
                    <div key={c.code}
                         className="flex items-baseline justify-between gap-6 border-b border-line py-3.5 hover:bg-panel transition-colors">
                      <div className="min-w-0">
                        <div className="text-[15px] truncate">{c.label}</div>
                        <div className="label mt-0.5">{c.code}</div>
                      </div>
                      <div className="figure text-[26px] shrink-0">{c.points}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
