"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Preview = { team_name: string; published_total: number; live_total: number; change: number };

export default function Publish() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<Preview[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("preview_publish");
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as Preview[]);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function go() {
    setBusy(true); setErr(null); setOk(null);
    const { error } = await supabase.rpc("publish_leaderboard", { p_note: note.trim() || null });
    setBusy(false);
    setConfirm(false);
    if (error) { setErr(error.message); return; }
    setOk("Published. Every team's site and the public board now show these numbers.");
    setNote("");
    load();
  }

  const moving = rows.filter((r) => r.change !== 0);

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <div className="label text-mint">PUBLISH</div>
        <h1 className="font-display font-bold text-[40px] sm:text-[54px] leading-none tracking-tight mt-3">
          SIGN THE BOARD
        </h1>
        <p className="mt-4 text-ash leading-relaxed">
          Publishing takes a snapshot of the live count and makes it the public standing.
          Nothing a team does after this moment shows up until the next publish. This is
          deliberate: it means every team&rsquo;s number changes at the same instant, and
          nobody can watch a rival&rsquo;s total creep up through the day.
        </p>
      </div>

      {loading && <p className="label">LOADING&hellip;</p>}

      {!loading && (
        <div className="border border-line">
          <div className="grid grid-cols-[1fr_repeat(3,minmax(72px,auto))] gap-4 px-5 py-3 border-b border-line bg-panel">
            <span className="label">TEAM</span>
            <span className="label text-right">PUBLISHED</span>
            <span className="label text-right">LIVE</span>
            <span className="label text-right">CHANGE</span>
          </div>
          {rows.map((r) => (
            <div key={r.team_name}
                 className="grid grid-cols-[1fr_repeat(3,minmax(72px,auto))] gap-4 px-5 py-4 border-b border-line last:border-b-0 items-center">
              <span className="font-display font-bold text-[18px] tracking-tight truncate">{r.team_name}</span>
              <span className="font-mono text-[13px] text-slate text-right">{r.published_total}</span>
              <span className="font-mono text-[13px] text-bone text-right">{r.live_total}</span>
              <span className={`font-mono text-[13px] text-right ${r.change > 0 ? "text-mint" : r.change < 0 ? "text-[#F0A9A4]" : "text-slate"}`}>
                {r.change > 0 ? `+${r.change}` : r.change}
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && moving.length === 0 && (
        <p className="border-l-2 border-line pl-3 text-sm text-ash leading-relaxed">
          Nothing has moved since the last publish. Publishing again is harmless, it just
          writes an identical board with a new timestamp.
        </p>
      )}

      <div className="border-t border-line pt-8 space-y-5">
        <label className="block max-w-xl">
          <span className="label block mb-1.5">NOTE ON THIS PUBLISH &mdash; OPTIONAL, BUT IT IS THE RECORD</span>
          <input value={note} onChange={(e) => setNote(e.target.value)}
                 placeholder="Week 3 board. Includes the hackathon results and Harsh's bonus round."
                 className="w-full bg-panel border border-line px-3 py-2.5 text-sm text-bone placeholder:text-slate focus:outline-none focus:border-mint transition-colors" />
        </label>

        {err && <p className="border-l-2 border-ascend pl-3 text-sm text-[#F0A9A4] leading-relaxed">{err}</p>}
        {ok && <p className="border-l-2 border-mint pl-3 text-sm text-mint leading-relaxed">{ok}</p>}

        {!confirm ? (
          <button onClick={() => setConfirm(true)}
                  className="font-mono text-[10px] tracking-[0.18em] bg-bone text-ink px-6 py-3.5 hover:bg-mint transition-colors">
            PUBLISH THE BOARD
          </button>
        ) : (
          <div className="panel p-5 space-y-4">
            <p className="text-sm text-ash leading-relaxed">
              {moving.length
                ? `This moves ${moving.length} team${moving.length > 1 ? "s" : ""}. Everyone sees it immediately, and it cannot be quietly undone — correcting it means publishing again.`
                : "Nothing is moving. This writes an identical board with a fresh timestamp."}
            </p>
            <div className="flex gap-2">
              <button disabled={busy} onClick={go}
                      className="font-mono text-[10px] tracking-[0.18em] bg-mint text-ink px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-40">
                {busy ? "PUBLISHING…" : "YES, PUBLISH"}
              </button>
              <button onClick={() => setConfirm(false)}
                      className="font-mono text-[10px] tracking-[0.18em] border border-line px-6 py-3 hover:text-bone transition-colors">
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
