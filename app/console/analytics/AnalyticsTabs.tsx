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

const TABS = [
  { id: "team",    label: "BY TEAM" },
  { id: "category", label: "BY CATEGORY" },
  { id: "dept",    label: "BY DEPT" },
  { id: "member",  label: "BY MEMBER" },
  { id: "adj",     label: "ADJUSTMENTS" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[8px] bg-panel border border-line overflow-hidden mt-2">
      <div className="h-full" style={{ width: `${Math.max(2, pct)}%`, background: color, opacity: 0.85 }} />
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <i className="w-[8px] h-[8px] shrink-0 inline-block" style={{ background: color }} />;
}

// Pastel dept colours (deterministic)
const DEPT_COLORS = [
  "#A7DFDA", "#A49AEA", "#F0C27F", "#F0A9A4",
  "#7FC8F0", "#C2F07F", "#F07FC8", "#B0B0B0",
];
function deptColor(dept: string, all: string[]) {
  const idx = all.indexOf(dept);
  return DEPT_COLORS[idx % DEPT_COLORS.length];
}

export function AnalyticsTabs({ data }: { data: AnalyticsDeep }) {
  const [tab, setTab] = useState<Tab>("team");

  const teamMax = Math.max(1, ...data.by_team.map((t) => t.total_points));
  const catMax  = Math.max(1, ...data.by_category.map((c) => c.approved_points));
  const actMax  = Math.max(1, ...data.by_activity.map((a) => a.approved_points));
  const deptMax = Math.max(1, ...data.by_dept.map((d) => d.approved_points));
  const memMax  = Math.max(1, ...data.top_members.map((m) => m.approved_points));
  const allDepts = data.by_dept.map((d) => d.dept);

  return (
    <div>
      {/* tab bar */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-line mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`font-mono text-[10px] tracking-[0.16em] px-4 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id
                ? "text-bone border-bone"
                : "text-slate border-transparent hover:text-bone"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ───────────── BY TEAM ───────────── */}
      {tab === "team" && (
        <div className="space-y-5">
          {data.by_team.map((t) => {
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
          {data.by_team.length === 0 && <p className="text-ash text-sm">No team data yet.</p>}
        </div>
      )}

      {/* ───────────── BY CATEGORY ───────────── */}
      {tab === "category" && (
        <div className="space-y-10">
          {/* category-level rollup */}
          <div className="space-y-5">
            {data.by_category.map((c) => (
              <div key={c.category}>
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <span className="label text-bone">{CATEGORY_LABEL[c.category] ?? c.category.toUpperCase()}</span>
                  <span className="font-mono text-[12px] text-ash">
                    {c.submission_count} submissions ·{" "}
                    <span className="text-bone">{c.approved_points} pts</span>
                  </span>
                </div>
                <Bar pct={(c.approved_points / catMax) * 100} color="#A49AEA" />
              </div>
            ))}
          </div>

          {/* per-activity drill-down */}
          <div>
            <h3 className="label text-ash mb-4">ACTIVITY BREAKDOWN</h3>
            <div className="border-t border-line">
              {data.by_activity.filter((a) => a.count > 0).map((a) => (
                <div key={a.code}
                  className="grid grid-cols-[1fr_auto] gap-4 border-b border-line py-3 items-center">
                  <div>
                    <div className="text-[13px] text-bone leading-snug">{a.label}</div>
                    <div className="label text-slate mt-0.5">
                      {CATEGORY_LABEL[a.category] ?? a.category.toUpperCase()}
                    </div>
                    <Bar pct={(a.approved_points / actMax) * 100} color="#A49AEA" />
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[18px] text-bone">{a.approved_points}</div>
                    <div className="label text-slate">{a.count}×</div>
                  </div>
                </div>
              ))}
              {data.by_activity.filter((a) => a.count > 0).length === 0 && (
                <p className="py-6 text-ash text-sm">Nothing approved yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────── BY DEPT ───────────── */}
      {tab === "dept" && (
        <div className="space-y-5">
          {data.by_dept.map((d) => {
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
                <Bar pct={(d.approved_points / deptMax) * 100} color={color} />
              </div>
            );
          })}
          {data.by_dept.length === 0 && <p className="text-ash text-sm">No department data yet.</p>}
        </div>
      )}

      {/* ───────────── BY MEMBER ───────────── */}
      {tab === "member" && (
        <div className="border-t border-line">
          {data.top_members.length === 0 && (
            <p className="py-6 text-ash text-sm">No approved points yet.</p>
          )}
          {data.top_members.map((m, i) => {
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
                  <Bar pct={(m.approved_points / memMax) * 100} color={accent} />
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

      {/* ───────────── ADJUSTMENTS ───────────── */}
      {tab === "adj" && (
        <div className="border-t border-line">
          {data.adjustments.length === 0 && (
            <p className="py-6 text-ash text-sm">No adjustments on record.</p>
          )}
          {data.adjustments.map((a, i) => {
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
