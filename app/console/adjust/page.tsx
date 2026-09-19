"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { accentOf } from "@/lib/types";

type Team = { id: string; name: string; slug: string };
type Member = { id: string; team_id: string; display_name: string | null; active: boolean };
type Adj = {
  id: string; team_id: string; team_name: string; team_slug: string;
  member_id: string | null; member_name: string | null;
  points: number; reason: string; kind: string;
  occurred_on: string | null; created_at: string;
  reverses: string | null; reversed_by: string | null;
};

export default function Adjust() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [rows, setRows] = useState<Adj[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [team, setTeam] = useState("");
  const [member, setMember] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [kind, setKind] = useState("manual");
  const [on, setOn] = useState("");

  const load = useCallback(async () => {
    const [t, m, a] = await Promise.all([
      supabase.from("teams").select("id,name,slug").eq("active", true).order("name"),
      supabase.from("members").select("id,team_id,display_name,active").order("display_name"),
      supabase.rpc("list_adjustments", { p_limit: 200 }),
    ]);
    if (t.data) setTeams(t.data as Team[]);
    if (m.data) setMembers(m.data as Member[]);
    if (a.data) setRows(a.data as Adj[]);
    if (a.error) {
      setErr(
        a.error.message.includes("list_adjustments")
          ? "The list_adjustments function is not on central yet. Run sql/01_console_reads.sql in the SQL Editor once, and this list fills in. Recording a new adjustment works either way."
          : a.error.message
      );
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "—";
  const teamSlug = (id: string) => teams.find((t) => t.id === id)?.slug ?? "";
  const memberName = (id: string | null) => (id ? members.find((m) => m.id === id)?.display_name ?? "—" : null);
  const reversed = useMemo(() => new Set(rows.filter((r) => r.reverses).map((r) => r.reverses!)), [rows]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(points, 10);
    setErr(null); setOk(null);
    if (!team) return setErr("Pick a team.");
    if (!n || Number.isNaN(n)) return setErr("Points must be a whole number, and it cannot be zero. Use a minus sign to take points away.");
    if (reason.trim().length < 3) return setErr("Write the reason. This is the only thing anyone will have to go on in three weeks.");

    setBusy(true);
    const { error } = await supabase.rpc("adjust_points", {
      p_team: team,
      p_points: n,
      p_reason: reason.trim(),
      p_member: member || null,
      p_kind: kind,
      p_occurred_on: on || null,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setOk(`${n > 0 ? "Added" : "Removed"} ${Math.abs(n)} points. It counts immediately in the live total, and reaches the public board at the next publish.`);
    setPoints(""); setReason(""); setMember("");
    load();
  }

  async function reverse(a: Adj) {
    const why = window.prompt("Why is this being reversed? The original stays on the record either way.");
    if (!why || why.trim().length < 3) return;
    setBusy(true); setErr(null); setOk(null);
    const { error } = await supabase.rpc("reverse_adjustment", { p_id: a.id, p_reason: why.trim() });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setOk("Reversed. Both entries stay visible, which is the point.");
    load();
  }

  const teamMembers = members.filter((m) => m.team_id === team && m.active);

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <div className="label text-mint">ADJUST</div>
        <h1 className="font-display font-bold text-[40px] sm:text-[54px] leading-none tracking-tight mt-3">
          BONUSES AND PENALTIES
        </h1>
        <p className="mt-4 text-ash leading-relaxed">
          For anything the catalog does not cover: a judged result, a hand-calculated
          week, a penalty. It lands on the live total straight away and on the public
          board at the next publish. Nothing here is anonymous and nothing here is
          deleted &mdash; a mistake is corrected by reversing it, and both entries stay.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-10">
        <form onSubmit={submit} className="space-y-5">
          <Field label="TEAM">
            <select required value={team} onChange={(e) => { setTeam(e.target.value); setMember(""); }} className={input}>
              <option value="">choose a team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>

          <Field label="PERSON — OPTIONAL, LEAVE BLANK FOR THE WHOLE TEAM">
            <select value={member} onChange={(e) => setMember(e.target.value)} disabled={!team} className={input}>
              <option value="">the team as a whole</option>
              {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.display_name ?? m.id.slice(0, 8)}</option>)}
            </select>
          </Field>

          <Field label="POINTS — MINUS SIGN TAKES THEM AWAY">
            <input required value={points} onChange={(e) => setPoints(e.target.value)}
                   inputMode="numeric" placeholder="30   or   -15"
                   className={`${input} font-mono`} />
          </Field>

          <Field label="REASON">
            <textarea required rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="Week 1 result calculated by hand before central was live. Proof held by Harsh."
                      className={`${input} resize-none`} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="KIND">
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={input}>
                <option value="manual">manual</option>
                <option value="week1_seed">week1_seed</option>
                <option value="correction">correction</option>
              </select>
            </Field>
            <Field label="DATED — OPTIONAL">
              <input type="date" value={on} onChange={(e) => setOn(e.target.value)} className={input} />
            </Field>
          </div>

          {err && <p className="border-l-2 border-ascend pl-3 text-sm text-[#F0A9A4] leading-relaxed">{err}</p>}
          {ok && <p className="border-l-2 border-mint pl-3 text-sm text-mint leading-relaxed">{ok}</p>}

          <button disabled={busy}
                  className="w-full font-mono text-[10px] tracking-[0.18em] bg-bone text-ink py-3.5 hover:bg-mint transition-colors disabled:opacity-40">
            {busy ? "SAVING…" : "RECORD THE ADJUSTMENT"}
          </button>
        </form>

        <div>
          <h2 className="font-display font-bold text-[26px] tracking-tight">ON THE RECORD</h2>
          <div className="mt-5 border-t border-line">
            {rows.length === 0 && <p className="py-8 text-ash text-sm">No adjustments have been made.</p>}
            {rows.map((a) => {
              const isRev = !!a.reverses;
              const wasRev = reversed.has(a.id);
              return (
                <div key={a.id} className={`border-b border-line py-4 ${wasRev ? "opacity-45" : ""}`}>
                  <div className="flex items-baseline gap-3">
                    <i className="w-[8px] h-[8px] shrink-0 translate-y-[1px]" style={{ background: accentOf(a.team_slug) }} />
                    <span className="font-display font-bold text-[17px] tracking-tight">{a.team_name}</span>
                    {a.member_name && <span className="label">{a.member_name}</span>}
                    <span className={`ml-auto font-mono text-[15px] ${a.points > 0 ? "text-mint" : "text-[#F0A9A4]"}`}>
                      {a.points > 0 ? `+${a.points}` : a.points}
                    </span>
                  </div>

                  <p className="mt-2 text-[13.5px] text-ash leading-relaxed">{a.reason}</p>

                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <span className="label">{a.kind.toUpperCase()}</span>
                    <span className="label">{new Date(a.created_at).toLocaleDateString("en-IN")}</span>
                    {isRev && <span className="label text-lav">REVERSAL</span>}
                    {wasRev && <span className="label text-lav">REVERSED</span>}
                    {!isRev && !wasRev && (
                      <button onClick={() => reverse(a)} disabled={busy}
                              className="label hover:text-ascend transition-colors">REVERSE</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const input =
  "w-full bg-panel border border-line px-3 py-2.5 text-[14px] text-bone placeholder:text-slate " +
  "focus:outline-none focus:border-mint transition-colors disabled:opacity-40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
