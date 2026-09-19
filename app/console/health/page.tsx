import { supabaseServer } from "@/lib/supabase-server";
import { accentOf } from "@/lib/types";

export const dynamic = "force-dynamic";

type Health = {
  team_name: string; team_slug: string;
  last_event_at: string | null;
  events_1h: number; events_24h: number; failed_24h: number;
  last_error: string | null;
  callback_url: string | null; callback_registered: boolean;
  outbox_pending: number; outbox_last_error: string | null;
};

export default async function Feeds() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("get_ingest_health");
  const rows = (data ?? []) as Health[];

  return (
    <div className="space-y-10">
      <div className="max-w-2xl">
        <div className="label text-mint">FEEDS</div>
        <h1 className="font-display font-bold text-[40px] sm:text-[54px] leading-none tracking-tight mt-3">
          IS EVERYONE REPORTING?
        </h1>
        <p className="mt-4 text-ash leading-relaxed">
          Each team&rsquo;s database pushes to central on its own, every minute. When a team
          goes quiet it is usually one of three things: nobody has submitted anything,
          their key was rotated, or their scheduled job stopped. This page tells you
          which.
        </p>
      </div>

      {error && <p className="border-l-2 border-ascend pl-3 text-sm text-[#F0A9A4]">{error.message}</p>}

      <div className="grid gap-px bg-line border border-line md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => {
          const quiet = !r.last_event_at;
          const stale = r.last_event_at
            ? Date.now() - new Date(r.last_event_at).getTime() > 1000 * 60 * 60 * 48
            : false;
          const bad = r.failed_24h > 0 || !!r.outbox_last_error;
          const tone = bad ? "#F0A9A4" : quiet || stale ? "#E8A33C" : "#A7DFDA";
          const state = bad ? "ERRORS" : quiet ? "NEVER REPORTED" : stale ? "QUIET 48H+" : "HEALTHY";

          return (
            <div key={r.team_slug} className="bg-ink p-5">
              <div className="flex items-center gap-2.5">
                <i className="w-[9px] h-[9px]" style={{ background: accentOf(r.team_slug) }} />
                <span className="font-display font-bold text-[19px] tracking-tight">{r.team_name}</span>
                <span className="label ml-auto" style={{ color: tone }}>{state}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <Num k="LAST HOUR" v={r.events_1h} />
                <Num k="LAST DAY" v={r.events_24h} />
                <Num k="FAILED" v={r.failed_24h} bad={r.failed_24h > 0} />
              </div>

              <div className="mt-4 space-y-1.5">
                <Row k="LAST HEARD" v={r.last_event_at ? new Date(r.last_event_at).toLocaleString("en-IN") : "never"} />
                <Row k="QUEUED THERE" v={String(r.outbox_pending ?? 0)} />
                <Row k="CALLBACK" v={r.callback_registered ? "registered" : "not registered"} />
              </div>

              {(r.last_error || r.outbox_last_error) && (
                <p className="mt-4 border-l-2 border-ascend pl-3 text-[12px] text-[#F0A9A4] leading-relaxed break-words">
                  {r.last_error ?? r.outbox_last_error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[13px] text-slate leading-relaxed max-w-2xl">
        A team showing nothing in the last hour is normal. A team showing failures, or
        a queue that keeps growing on their side, means their database is trying and
        being turned away &mdash; check the key first.
      </p>
    </div>
  );
}

function Num({ k, v, bad }: { k: string; v: number; bad?: boolean }) {
  return (
    <div>
      <div className={`figure text-[26px] ${bad ? "text-[#F0A9A4]" : "text-bone"}`}>{v}</div>
      <div className="label mt-0.5">{k}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="label">{k}</span>
      <span className="font-mono text-[11px] text-ash truncate">{v}</span>
    </div>
  );
}
