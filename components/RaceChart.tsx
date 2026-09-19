import { accentOf, metaOf } from "@/lib/teams";
import type { TimelineRow } from "@/lib/public";

/**
 * Every signed board, drawn as one line per team. Server rendered SVG: no
 * charting library, no client JavaScript, and it prints correctly.
 */
export function RaceChart({ rows }: { rows: TimelineRow[] }) {
  const stamps = Array.from(new Set(rows.map((r) => r.published_at))).sort();
  if (stamps.length === 0) return null;

  const slugs = Array.from(new Set(rows.map((r) => r.team_slug)));
  const byTeam = new Map<string, { x: number; y: number; v: number }[]>();

  const max = Math.max(1, ...rows.map((r) => r.total_points));
  const W = 1000, H = 340, PAD_L = 8, PAD_R = 8, PAD_T = 16, PAD_B = 34;
  const xAt = (i: number) =>
    stamps.length === 1 ? W / 2 : PAD_L + (i * (W - PAD_L - PAD_R)) / (stamps.length - 1);
  const yAt = (v: number) => PAD_T + (1 - v / max) * (H - PAD_T - PAD_B);

  for (const slug of slugs) {
    byTeam.set(
      slug,
      stamps.map((s, i) => {
        const hit = rows.find((r) => r.published_at === s && r.team_slug === slug);
        const v = hit?.total_points ?? 0;
        return { x: xAt(i), y: yAt(v), v };
      })
    );
  }

  const last = stamps[stamps.length - 1];
  const finals = slugs
    .map((s) => ({ slug: s, v: rows.find((r) => r.published_at === last && r.team_slug === s)?.total_points ?? 0 }))
    .sort((a, b) => b.v - a.v);

  return (
    <div>
      <div className="border border-line bg-ink p-4 sm:p-6">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
             aria-label="Points per team across every published board">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={PAD_L} x2={W - PAD_R} y1={yAt(max * f)} y2={yAt(max * f)}
                    stroke="#1E2631" strokeWidth="1" />
              <text x={PAD_L} y={yAt(max * f) - 6} fill="#41434A"
                    fontFamily="monospace" fontSize="11">{Math.round(max * f)}</text>
            </g>
          ))}

          {slugs.map((slug) => {
            const pts = byTeam.get(slug)!;
            const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
            return (
              <g key={slug}>
                <path d={d} fill="none" stroke={accentOf(slug)} strokeWidth="2.5"
                      strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#0B0E13"
                          stroke={accentOf(slug)} strokeWidth="2" />
                ))}
              </g>
            );
          })}

          {stamps.map((s, i) => (
            <text key={s} x={xAt(i)} y={H - 10} fill="#616264" fontFamily="monospace" fontSize="11"
                  textAnchor={i === 0 ? "start" : i === stamps.length - 1 ? "end" : "middle"}>
              {new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase()}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
        {finals.map((f) => (
          <span key={f.slug} className="flex items-center gap-2">
            <i className="w-[10px] h-[3px]" style={{ background: accentOf(f.slug) }} />
            <span className="label">{metaOf(f.slug)?.name ?? f.slug}</span>
            <span className="font-mono text-[12px] text-ash">{f.v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
