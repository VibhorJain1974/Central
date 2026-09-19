"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { accentOf, type QueueRow, type Proof } from "@/lib/types";

type Decision = "approved" | "rejected" | "needs_info";

export default function Review() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<string>("all");
  const [done, setDone] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_review_queue", { p_limit: 200 });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    const list = (data ?? []) as QueueRow[];
    setRows(list);
    setSel((cur) => (cur && list.some((r) => r.id === cur) ? cur : list[0]?.id ?? null));
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const teams = useMemo(
    () => Array.from(new Set(rows.map((r) => r.team_slug))).sort(),
    [rows]
  );
  const shown = useMemo(
    () => (team === "all" ? rows : rows.filter((r) => r.team_slug === team)),
    [rows, team]
  );
  const current = shown.find((r) => r.id === sel) ?? shown[0] ?? null;

  const decide = useCallback(async (decision: Decision) => {
    if (!current || busy) return;
    if (decision !== "approved" && note.trim().length < 3) {
      setErr("Write a short reason. The team sees it, and a rejection with no reason is the thing everyone argues about later.");
      return;
    }
    setBusy(true); setErr(null);
    const { error } = await supabase.rpc("decide_submission", {
      p_submission: current.id,
      p_decision: decision,
      p_note: note.trim() || null,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }

    // Move to the next one without a round trip, so a run of twenty feels like twenty.
    const idx = shown.findIndex((r) => r.id === current.id);
    const next = shown[idx + 1] ?? shown[idx - 1] ?? null;
    setRows((rs) => rs.filter((r) => r.id !== current.id));
    setSel(next?.id ?? null);
    setNote("");
    setDone((d) => d + 1);
  }, [current, busy, note, shown, supabase]);

  // Harsh has a lot of these to get through. Keys beat clicks.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "a" || e.key === "A") { e.preventDefault(); decide("approved"); }
      if (e.key === "j" || e.key === "ArrowDown") {
        const i = shown.findIndex((r) => r.id === sel);
        if (shown[i + 1]) setSel(shown[i + 1].id);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        const i = shown.findIndex((r) => r.id === sel);
        if (shown[i - 1]) setSel(shown[i - 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, shown, sel]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <div className="label text-mint">REVIEW</div>
          <h1 className="font-display font-bold text-[40px] sm:text-[54px] leading-none tracking-tight mt-3">
            {shown.length} WAITING
          </h1>
          <p className="mt-3 text-ash text-sm max-w-xl leading-relaxed">
            Every one of these was already checked by its own team lead. You are the
            second pair of eyes, and the only one whose decision moves the board.
            {done > 0 && <> You have cleared {done} in this sitting.</>}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Chip on={team === "all"} onClick={() => setTeam("all")}>ALL</Chip>
          {teams.map((t) => (
            <Chip key={t} on={team === t} onClick={() => setTeam(t)} dot={accentOf(t)}>
              {t.replace("-", " ").toUpperCase()}
            </Chip>
          ))}
          <button onClick={load} className="label hover:text-bone transition-colors ml-2">REFRESH</button>
        </div>
      </div>

      {err && (
        <p className="border-l-2 border-ascend pl-3 text-sm text-[#F0A9A4] leading-relaxed">{err}</p>
      )}

      {loading && <p className="label">LOADING&hellip;</p>}

      {!loading && shown.length === 0 && (
        <div className="panel p-10 text-center">
          <div className="label text-mint">NOTHING WAITING</div>
          <h2 className="font-display font-bold text-[34px] tracking-tight mt-3">THE QUEUE IS CLEAR.</h2>
          <p className="mt-3 text-ash text-sm">
            Every verified submission that has reached central has been decided.
          </p>
        </div>
      )}

      {shown.length > 0 && (
        <div className="grid lg:grid-cols-[340px_1fr] gap-px bg-line border border-line">
          {/* The queue */}
          <div className="bg-ink max-h-[72vh] overflow-y-auto">
            {shown.map((r) => {
              const on = current?.id === r.id;
              return (
                <button key={r.id} onClick={() => { setSel(r.id); setNote(""); setErr(null); }}
                        className={`w-full text-left px-4 py-3.5 border-b border-line transition-colors ${on ? "bg-panel" : "hover:bg-panel/60"}`}>
                  <div className="flex items-center gap-2">
                    <i className="w-[7px] h-[7px] shrink-0" style={{ background: accentOf(r.team_slug) }} />
                    <span className="label">{r.team_name}</span>
                    <span className="ml-auto font-mono text-[12px] text-mint">+{r.activity_points}</span>
                  </div>
                  <div className={`mt-1.5 text-[14px] leading-snug line-clamp-2 ${on ? "text-bone" : "text-ash"}`}>
                    {r.title}
                  </div>
                  <div className="label mt-1.5">{r.member_name ?? "TEAM"} &middot; {r.occurred_on}</div>
                </button>
              );
            })}
          </div>

          {/* The one in front of you */}
          {current && (
            <div className="bg-ink p-6 sm:p-8 max-h-[72vh] overflow-y-auto">
              <div className="flex items-center gap-2.5">
                <i className="w-[10px] h-[10px]" style={{ background: accentOf(current.team_slug) }} />
                <span className="label">{current.team_name}</span>
                <span className="label">&middot; {current.category.replace(/_/g, " ").toUpperCase()}</span>
              </div>

              <h2 className="font-display font-bold text-[30px] sm:text-[38px] leading-[0.95] tracking-tight mt-3">
                {current.title}
              </h2>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line">
                <Meta k="WORTH" v={`+${current.activity_points}`} accent />
                <Meta k="ACTIVITY" v={current.activity_label} />
                <Meta k="WHEN" v={current.occurred_on} />
                <Meta k="BY" v={current.member_name ?? "—"} />
              </div>

              {current.contributors?.length ? (
                <div className="mt-4">
                  <div className="label">ALSO CREDITED</div>
                  <div className="mt-1.5 text-sm text-ash">{current.contributors.join(", ")}</div>
                </div>
              ) : null}

              {current.venue && (
                <div className="mt-4">
                  <div className="label">VENUE</div>
                  <div className="mt-1.5 text-sm text-ash">{current.venue}</div>
                </div>
              )}

              {current.description && (
                <div className="mt-5">
                  <div className="label">WHAT THEY SAID</div>
                  <p className="mt-2 text-[14.5px] text-ash leading-relaxed whitespace-pre-wrap">{current.description}</p>
                </div>
              )}

              <div className="mt-7">
                <div className="label">PROOF ({current.proofs?.length ?? 0})</div>
                <ProofWall proofs={current.proofs ?? []} />
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <label className="block">
                  <span className="label block mb-1.5">NOTE &mdash; REQUIRED TO REJECT OR ASK FOR MORE</span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                            placeholder="Certificate does not name the event. Send the one with the date on it."
                            className="w-full bg-panel border border-line px-3 py-2.5 text-sm text-bone placeholder:text-slate focus:outline-none focus:border-mint transition-colors resize-none" />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => decide("approved")}
                          className="font-mono text-[10px] tracking-[0.18em] bg-bone text-ink px-5 py-3 hover:bg-mint transition-colors disabled:opacity-40">
                    APPROVE &nbsp;+{current.activity_points}
                  </button>
                  <button disabled={busy} onClick={() => decide("needs_info")}
                          className="font-mono text-[10px] tracking-[0.18em] border border-line px-5 py-3 hover:border-mint hover:text-mint transition-colors disabled:opacity-40">
                    ASK FOR MORE
                  </button>
                  <button disabled={busy} onClick={() => decide("rejected")}
                          className="font-mono text-[10px] tracking-[0.18em] border border-line px-5 py-3 hover:border-ascend hover:text-ascend transition-colors disabled:opacity-40">
                    REJECT
                  </button>
                  <span className="label self-center ml-1">A APPROVE &middot; J/K MOVE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ProofWall({ proofs }: { proofs: Proof[] }) {
  if (!proofs.length) {
    return (
      <p className="mt-2 text-sm text-[#F0A9A4] leading-relaxed">
        Nothing attached. That is unusual for a verified submission &mdash; ask the lead
        before approving it.
      </p>
    );
  }
  return (
    <div className="mt-3 grid sm:grid-cols-2 gap-3">
      {proofs.map((p, i) => <ProofCard key={i} p={p} n={i + 1} />)}
    </div>
  );
}

function ProofCard({ p, n }: { p: Proof; n: number }) {
  const url = p.url ?? "";
  const clean = url.split("?")[0].toLowerCase();
  const isImg = /\.(png|jpe?g|gif|webp|avif|bmp)$/.test(clean);
  const isPdf = /\.pdf$/.test(clean);
  const name = p.filename ?? `PROOF ${n}`;

  return (
    <a href={url} target="_blank" rel="noreferrer"
       className="group block border border-line bg-panel hover:border-mint transition-colors overflow-hidden">
      <div className="h-40 bg-ink flex items-center justify-center overflow-hidden">
        {isImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="h-full w-full object-cover group-hover:opacity-90 transition-opacity" />
        ) : (
          <div className="text-center px-4">
            <div className="figure text-[30px] text-slate group-hover:text-mint transition-colors">
              {isPdf ? "PDF" : "FILE"}
            </div>
            <div className="label mt-2">OPENS IN A NEW TAB</div>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5 border-t border-line">
        <div className="text-[12px] text-ash truncate">{name}</div>
      </div>
    </a>
  );
}

function Meta({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-ink p-3">
      <div className="label">{k}</div>
      <div className={`mt-1.5 text-[13px] leading-snug ${accent ? "text-mint font-mono" : "text-bone"}`}>{v}</div>
    </div>
  );
}

function Chip({ on, onClick, children, dot }: { on: boolean; onClick: () => void; children: React.ReactNode; dot?: string }) {
  return (
    <button onClick={onClick}
            className={`flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] px-3 py-2 border transition-colors ${
              on ? "bg-bone text-ink border-bone" : "border-line text-slate hover:text-bone"}`}>
      {dot && <i className="w-[6px] h-[6px]" style={{ background: dot }} />}
      {children}
    </button>
  );
}
