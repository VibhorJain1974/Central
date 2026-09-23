"use client";

import { useState } from "react";
import { accentOf } from "@/lib/types";

type TeamRow = {
  team_name: string; slug: string;
  approved_points: number; adjustment_points: number; total_points: number;
  submission_count: number; member_count: number;
};
type CategoryRow = {
  category: string; approved_points: number; submission_count: number; unique_activities: number;
};
type ActivityRow = {
  code: string; label: string; category: string; approved_points: number; count: number;
};
type DeptRow = {
  dept: string; approved_points: number; member_count: number;
};
type MemberRow = {
  display_name: string; department: string | null; team_name: string; team_slug: string;
  approved_points: number; submission_count: number;
};
type AdjRow = {
  team_name: string; team_slug: string; points: number; reason: string; kind: string; occurred_on: string;
};

export type AnalyticsDeep = {
  by_team: TeamRow[];
  by_category: CategoryRow[];
  by_activity: ActivityRow[];
  by_dept: DeptRow[];
  top_members: MemberRow[];
  adjustments: AdjRow[];
};

const CATEGORY_LABEL: Record<string, string> = {
  team_activity: "TEAM ACTIVITIES",
  individual: "INDIVIDUAL",
  sprint_track: "SPRINT TRACK",
};

const CATEGORY_COLOR: Record<string, string> = {
  team_activity: "#A49AEA",
  individual: "#A7DFDA",
  sprint_track: "#F0C27F",
};

const TABS = [
  { id: "team",     label: "BY TEAM" },
  { id: "category", label: "BY CATEGORY" },
  { id: "dept",     label: "BY DEPT" },
  { id: "member",   label: "BY MEMBER" },
  { id: "adj",      label: "ADJUSTMENTS" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const DEPT_COLORS = [
  "#A7DFDA", "#A49AEA", "#F0C27F", "#F0A9A4",
  "#7FC8F0", "#C2F07F", "#F07FC8", "#B0B0B0",
];

function deptColor(dept: string, all: string[]) {
  return DEPT_COLORS[all.indexOf(dept) % DEPT_COLORS.length];
}

// ─── Shared bar ────────────────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[7px] bg-panel border border-line overflow-hidden mt-2 rounded-sm">
      <div className="h-full transition-all duration-500"
        style={{ width: `${Math.max(2, pct)}%`, background: color, opacity: 0.85 }} />
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <i className="w-[8px] h-[8px] shrink-0 inline-block rounded-sm" style={{ background: color }} />;
}

// ─── SVG Donut chart ───────────────────────────────────────────────────────
function DonutChart({
  slices, total, centerLabel = "PTS",
}: {
  slices: { value: number; color: string }[];
  total: number;
  centerLabel?: string;
}) {
  if (!total) return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0">
      <circle cx="60" cy="60" r="46" fill="none" stroke="#1a1d23" strokeWidth="16" />
      <text x="60" y="64" textAnchor="middle" fill="#41434a" fontSize="9" fontFamily="monospace">NO DATA</text>
    </svg>
  );

  const R = 46;
  const C = 2 * Math.PI * R;
  let cum = 0;

  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0">
      <circle cx="60" cy="60" r={R} fill="none" stroke="#16191f" strokeWidth="16" />
      {slices.filter(s => s.value > 0).map((sl, i) => {
        const dash = (sl.value / total) * C;
        const off = C / 4 - cum;
        cum += dash;
        return (
          <circle key={i} cx="60" cy="60" r={R} fill="none"
            stroke={sl.color} strokeWidth="16" opacity="0.88"
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={off}
          />
        );
      })}
      <text x="60" y="56" textAnchor="middle" fill="#e8e6e0"
        fontSize="20" fontWeight="bold" fontFamily="monospace">{total}</text>
      <text x="60" y="71" textAnchor="middle" fill="#41434a"
        fontSize="7" fontFamily="monospace" letterSpacing="1">{centerLabel}</text>
    </svg>
  );
}

// ─── SVG vertical histogram ────────────────────────────────────────────────
function Histogram({
  bars, color,
}: {
  bars: { label: string; value: number; pts: number }[];
  color: string;
}) {
  const maxPts = Math.max(1, ...bars.map(b => b.pts));
  const maxCnt = Math.max(1, ...bars.map(b => b.value));
  const H = 56;
  const bw = Math.max(6, Math.floor(Math.min(28, (320 - bars.length * 3) / bars.length)));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${bars.length * (bw + 3)} ${H + 2}`}
        style={{ width: bars.length * (bw + 3), height: H + 2 }}
        className="block"
      >
        {bars.map((b, i) => {
          const x = i * (bw + 3);
          const barH = Math.max(2, (b.pts / maxPts) * H);
          return (
            <g key={i}>
              <rect x={x} y={H - barH} width={bw} height={barH}
                fill={color} opacity="0.75" rx="1" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Mini pie (for team share) ─────────────────────────────────────────────
function TeamPie({ teams, max }: { teams: TeamRow[]; max: number }) {
  const total = teams.reduce((s, t) => s + t.total_points, 0);
  return (
    <DonutChart
      total={total}
      centerLabel="ALL PTS"
      slices={teams.map(t => ({ value: t.total_points, color: accentOf(t.slug) }))}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export function AnalyticsTabs({ data }: { data: AnalyticsDeep }) {
  const [tab, setTab] = useState<Tab>("team");

  const teams   = data.by_team     ?? [];
  const cats    = data.by_category ?? [];
  const acts    = data.by_activity ?? [];
  const depts   = data.by_dept     ?? [];
  const members = data.top_members ?? [];
  const adjs    = data.adjustments ?? [];

  const teamMax = Math.max(1, ...teams.map(t => t.total_points));
  const catMax  = Math.max(1, ...cats.map(c => c.approved_points));
  const deptMax = Math.max(1, ...depts.map(d => d.approved_points));
  const memMax  = Math.max(1, ...members.map(m => m.approved_points));
  const allDepts = depts.map(d => d.dept);
  const totalPts = teams.reduce((s, t) => s + t.total_points, 0);

  return (
    <div>
      {/* tab bar */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-line mb-8">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`font-mono text-[10px] tracking-[0.16em] px-4 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id ? "text-bone border-bone" : "text-slate border-transparent hover:text-bone"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── BY TEAM ─────────────────────────────────────────────────── */}
      {tab === "team" && (
        <div>
          {teams.length === 0 ? (
            <p className="text-ash text-sm">No team data yet.</p>
          ) : (
            <>
              {/* donut + legend row */}
              <div className="flex gap-6 items-center mb-8 flex-wrap">
                <TeamPie teams={teams} max={teamMax} />
                <div className="flex flex-col gap-2 min-w-0">
                  {teams.map(t => (
                    <div key={t.team_name} className="flex items-center gap-2">
                      <Dot color={accentOf(t.slug)} />
                      <span className="label text-bone text-[11px]">{t.team_name}</span>
                      <span className="font-mono text-[11px] text-ash ml-auto pl-4">
                        {totalPts > 0 ? Math.round((t.total_points / totalPts) * 100) : 0}%
                        &nbsp;·&nbsp;{t.total_points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* bars */}
              <div className="space-y-5">
                {teams.map(t => {
                  const accent = accentOf(t.slug);
                  return (
                    <div key={t.team_name}>
                      <div className="flex items-baseline justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2.5">
                          <Dot color={accent} />
                          <span className="label text-bone">{t.team_name}</span>
                          <span className="label text-slate">{t.member_count} members</span>
                        </div>
                        <span className="font-mono text-[12px] text-ash">
                          {t.approved_points} approved
                          {t.adjustment_points !== 0 && (
                            <span style={{ color: t.adjustment_points > 0 ? "#A7DFDA" : "#F0A9A4" }}>
                              {" "}{t.adjustment_points > 0 ? "+" : ""}{t.adjustment_points} adj
                            </span>
                          )}
                          <span className="text-bone"> = {t.total_points} pts</span>
                        </span>
                      </div>
                      <Bar pct={(t.total_points / teamMax) * 100} color={accent} />
                      <div className="mt-1 label text-slate">{t.submission_count} approved submissions</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── BY CATEGORY ─────────────────────────────────────────────── */}
      {tab === "category" && (
        <div className="space-y-10">
          {/* donut + category legend */}
          <div className="flex gap-6 items-start flex-wrap">
            <DonutChart
              total={cats.reduce((s, c) => s + c.approved_points, 0)}
              slices={cats.map(c => ({ value: c.approved_points, color: CATEGORY_COLOR[c.category] ?? "#616264" }))}
            />
            <div className="space-y-4 flex-1 min-w-[180px]">
              {cats.map(c => {
                const color = CATEGORY_COLOR[c.category] ?? "#616264";
                return (
                  <div key={c.category}>
                    <div className="flex items-baseline justify-between gap-4 mb-1">
                      <div className="flex items-center gap-2">
                        <Dot color={color} />
                        <span className="label text-bone">{CATEGORY_LABEL[c.category] ?? c.category.toUpperCase()}</span>
                      </div>
                      <span className="font-mono text-[12px] text-ash">
                        {c.submission_count} subs · <span className="text-bone">{c.approved_points} pts</span>
                      </span>
                    </div>
                    <Bar pct={catMax > 0 ? (c.approved_points / catMax) * 100 : 0} color={color} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* activity histogram */}
          {acts.some(a => a.count > 0) && (
            <div>
              <h3 className="label text-ash mb-3">ACTIVITY HISTOGRAM <span className="text-slate normal-case font-sans font-normal">(pts per activity)</span></h3>
              <Histogram
                bars={acts.filter(a => a.count > 0).map(a => ({
                  label: a.label, value: a.count, pts: a.approved_points,
                }))}
                color="#A49AEA"
              />
              <div className="mt-1 label text-slate">{acts.filter(a => a.count > 0).length} distinct activities used</div>
            </div>
          )}

          {/* activity list */}
          <div>
            <h3 className="label text-ash mb-4">ACTIVITY BREAKDOWN</h3>
            <div className="border-t border-line">
              {acts.filter(a => a.count > 0).map(a => {
                const color = CATEGORY_COLOR[a.category] ?? "#A49AEA";
                const actMax = Math.max(1, ...acts.map(x => x.approved_points));
                return (
                  <div key={a.code}
                    className="grid grid-cols-[1fr_auto] gap-4 border-b border-line py-3 items-center">
                    <div>
                      <div className="text-[13px] text-bone leading-snug">{a.label}</div>
                      <div className="label text-slate mt-0.5">{CATEGORY_LABEL[a.category] ?? a.category.toUpperCase()}</div>
                      <Bar pct={(a.approved_points / actMax) * 100} color={color} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[18px] text-bone">{a.approved_points}</div>
                      <div className="label text-slate">{a.count}×</div>
                    </div>
                  </div>
                );
              })}
              {acts.filter(a => a.count > 0).length === 0 && (
                <p className="py-6 text-ash text-sm">Nothing approved yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── BY DEPT ─────────────────────────────────────────────────── */}
      {tab === "dept" && (
        <div>
          {depts.length === 0 ? (
            <p className="text-ash text-sm">No department data yet.</p>
          ) : (
            <>
              {/* donut + legend */}
              <div className="flex gap-6 items-center mb-8 flex-wrap">
                <DonutChart
                  total={depts.reduce((s, d) => s + d.approved_points, 0)}
                  centerLabel="ALL PTS"
                  slices={depts.map(d => ({ value: d.approved_points, color: deptColor(d.dept, allDepts) }))}
                />
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  {depts.map(d => {
                    const color = deptColor(d.dept, allDepts);
                    const total = depts.reduce((s, x) => s + x.approved_points, 0);
                    return (
                      <div key={d.dept} className="flex items-center gap-2">
                        <Dot color={color} />
                        <span className="label text-bone text-[11px]">{d.dept.toUpperCase()}</span>
                        <span className="label text-slate text-[11px]">{d.member_count}p</span>
                        <span className="font-mono text-[11px] text-ash ml-auto pl-4">
                          {total > 0 ? Math.round((d.approved_points / total) * 100) : 0}%
                          &nbsp;·&nbsp;{d.approved_points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* bars */}
              <div className="space-y-4">
                {depts.map(d => {
                  const color = deptColor(d.dept, allDepts);
                  return (
                    <div key={d.dept}>
                      <div className="flex items-baseline justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2.5">
                          <Dot color={color} />
                          <span className="label text-bone">{d.dept.toUpperCase()}</span>
                          <span className="label text-slate">{d.member_count} people</span>
                        </div>
                        <span className="font-mono text-[18px] text-bone">{d.approved_points} pts</span>
                      </div>
                      <Bar pct={deptMax > 0 ? (d.approved_points / deptMax) * 100 : 0} color={color} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── BY MEMBER ───────────────────────────────────────────────── */}
      {tab === "member" && (
        <div className="border-t border-line">
          {members.length === 0 && <p className="py-6 text-ash text-sm">No approved points yet.</p>}
          {members.map((m, i) => {
            const accent = accentOf(m.team_slug);
            return (
              <div key={i}
                className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-line py-3 items-center">
                <span className="font-mono text-[13px] text-slate w-6 text-right">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-[14px] text-bone leading-tight truncate">{m.display_name}</div>
                  <div className="label text-slate mt-0.5">
                    <span style={{ color: accent }}>{m.team_name}</span>
                    {m.department && <span> · {m.department.toUpperCase()}</span>}
                  </div>
                  <Bar pct={memMax > 0 ? (m.approved_points / memMax) * 100 : 0} color={accent} />
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[20px] text-bone">{m.approved_points}</div>
                  <div className="label text-slate">{m.submission_count}×</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ADJUSTMENTS ─────────────────────────────────────────────── */}
      {tab === "adj" && (
        <div className="border-t border-line">
          {adjs.length === 0 && <p className="py-6 text-ash text-sm">No adjustments on record.</p>}
          {adjs.map((a, i) => {
            const accent = accentOf(a.team_slug);
            return (
              <div key={i}
                className="grid grid-cols-[1fr_auto] gap-4 border-b border-line py-3 items-start">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="label" style={{ color: accent }}>{a.team_name}</span>
                    {a.kind && <span className="label text-slate">{a.kind.toUpperCase()}</span>}
                  </div>
                  <p className="mt-1 text-[13px] text-ash leading-snug">{a.reason}</p>
                  <div className="label text-slate mt-1">{a.occurred_on}</div>
                </div>
                <div className="font-mono text-[20px] shrink-0"
                  style={{ color: a.points >= 0 ? "#A7DFDA" : "#F0A9A4" }}>
                  {a.points > 0 ? `+${a.points}` : a.points}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
