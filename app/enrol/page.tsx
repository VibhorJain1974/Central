"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Mark } from "@/components/Mark";
import { accentOf, type Access } from "@/lib/types";

type Stage = "loading" | "door" | "code" | "in";

export default function Enrol() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("loading");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [access, setAccess] = useState<Access | null>(null);

  // Work out where the person stands: signed out, signed in but not yet
  // enrolled, or fully in.
  async function settle() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStage("door"); return; }
    const { data } = await supabase.rpc("my_access");
    const a = (data ?? null) as Access | null;
    setAccess(a);
    const enrolled = !!a && (!!a.staff_role || !!a.lead_of || a.can_view_all);
    setStage(enrolled ? "in" : "code");
    if (a?.display_name) setName(a.display_name);
  }

  useEffect(() => { settle(); /* eslint-disable-next-line */ }, []);

  async function door(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setNote(null);
    // Call these directly. Pulling the method off supabase.auth into a variable
    // detaches it from its object, and the client breaks the moment it reaches
    // for its own fetch.
    const creds = { email: email.trim(), password };
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword(creds)
        : await supabase.auth.signUp(creds);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    if (mode === "up") {
      setNote("Account made. If your project asks for email confirmation, open the link we sent you, then come back here.");
    }
    await settle();
  }

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { data, error } = await supabase.rpc("redeem_enrolment_code", {
      p_code: code.trim(),
      p_display_name: name.trim() || null,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    const res = data as { ok?: boolean; error?: string } | null;
    if (res && res.ok === false) { setErr(res.error ?? "That code was not accepted."); return; }
    // The role lands in the token, not the session we are holding. Get a fresh one.
    await supabase.auth.refreshSession();
    await settle();
  }

  async function out() {
    await supabase.auth.signOut();
    setAccess(null); setEmail(""); setPassword(""); setCode("");
    setStage("door");
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left: the statement. Central is the record keeper, and it says so. */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 border-r border-line overflow-hidden">
        <div className="absolute inset-0 opacity-[0.045] pointer-events-none"
             style={{ backgroundImage: "linear-gradient(#A7DFDA 1px, transparent 1px), linear-gradient(90deg, #A7DFDA 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
        <div className="relative flex items-center gap-3">
          <Mark size={34} />
          <div>
            <div className="font-display font-bold tracking-[0.2em] text-[15px] leading-none">AARVAK</div>
            <div className="label mt-1">CENTRAL</div>
          </div>
        </div>

        <div className="relative">
          <div className="label">TECH SPRINT JOURNEY 2026</div>
          <h1 className="font-display font-bold text-[64px] xl:text-[82px] leading-[0.86] mt-4 tracking-tight">
            FIVE TEAMS.<br />
            ONE<br />
            <span className="text-mint">RECORD.</span>
          </h1>
          <p className="mt-7 max-w-md text-ash text-[15px] leading-relaxed">
            Every submission a member makes on their own team&rsquo;s site arrives here on
            its own. Central does not re-type anything and does not take anyone&rsquo;s word
            for it. It holds the proof, the decision, and the timestamp.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-2">
            {["nexus", "echo", "ascend", "byte-brigade", "cipher"].map((slug) => (
              <span key={slug} className="flex items-center gap-2 label" style={{ color: "#999B9C" }}>
                <i className="inline-block w-[7px] h-[7px]" style={{ background: accentOf(slug) }} />
                {slug.replace("-", " ").toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <div className="relative label">VIPS-TC &middot; GGSIPU</div>
      </section>

      {/* Right: the door itself. */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Mark size={30} />
            <div className="font-display font-bold tracking-[0.2em] text-[14px]">AARVAK CENTRAL</div>
          </div>

          {stage === "loading" && <div className="label">CHECKING&hellip;</div>}

          {stage === "door" && (
            <form onSubmit={door} className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-[34px] leading-none tracking-tight">
                  {mode === "in" ? "SIGN IN" : "CREATE ACCOUNT"}
                </h2>
                <p className="mt-3 text-ash text-sm leading-relaxed">
                  {mode === "in"
                    ? "Organisers and team leads only. Members submit on their own team's site."
                    : "Use the email your enrolment code was issued to, or the code will not match."}
                </p>
              </div>

              <Field label="EMAIL">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                       autoComplete="email" className={input} placeholder="you@example.com" />
              </Field>

              <Field label="PASSWORD">
                <input type="password" required minLength={8} value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       autoComplete={mode === "in" ? "current-password" : "new-password"}
                       className={input} placeholder="at least 8 characters" />
              </Field>

              {err && <Alert>{err}</Alert>}
              {note && <Alert tone="ok">{note}</Alert>}

              <button disabled={busy} className={primary}>
                {busy ? "WORKING…" : mode === "in" ? "SIGN IN" : "CREATE ACCOUNT"}
              </button>

              <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); setNote(null); }}
                      className="label hover:text-bone transition-colors">
                {mode === "in" ? "NO ACCOUNT YET → CREATE ONE" : "← I ALREADY HAVE AN ACCOUNT"}
              </button>
            </form>
          )}

          {stage === "code" && (
            <form onSubmit={redeem} className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-[34px] leading-none tracking-tight">ENTER YOUR CODE</h2>
                <p className="mt-3 text-ash text-sm leading-relaxed">
                  You are signed in, but central does not know who you are yet. Paste the
                  enrolment code Vibbhor sent you. It only works once, and only for the
                  email it was issued to.
                </p>
              </div>

              <Field label="ENROLMENT CODE">
                <input required value={code} onChange={(e) => setCode(e.target.value)}
                       className={`${input} font-mono tracking-[0.12em]`} placeholder="tsj_..." />
              </Field>

              <Field label="YOUR NAME, AS IT SHOULD APPEAR">
                <input value={name} onChange={(e) => setName(e.target.value)} className={input}
                       placeholder="Harsh Gupta" />
              </Field>

              {err && <Alert>{err}</Alert>}

              <button disabled={busy} className={primary}>{busy ? "CHECKING…" : "REDEEM CODE"}</button>
              <button type="button" onClick={out} className="label hover:text-bone transition-colors">
                SIGN OUT
              </button>
            </form>
          )}

          {stage === "in" && access && (
            <div className="space-y-6">
              <div>
                <div className="label">YOU ARE IN</div>
                <h2 className="font-display font-bold text-[34px] leading-none tracking-tight mt-2">
                  {(access.display_name ?? "WELCOME").toUpperCase()}
                </h2>
              </div>

              <div className="panel p-4 space-y-2">
                <Row k="ROLE" v={roleLabel(access)} />
                <Row k="CAN APPROVE" v={access.can_approve ? "YES" : "NO"} />
                <Row k="CAN PUBLISH" v={access.can_publish ? "YES" : "NO"} />
                <Row k="SEES ALL TEAMS" v={access.can_view_all ? "YES" : "OWN TEAM ONLY"} />
              </div>

              <button onClick={() => router.push("/console")} className={primary}>OPEN THE CONSOLE</button>
              <div className="flex items-center justify-between">
                <Link href="/" className="label hover:text-bone transition-colors">&larr; PUBLIC BOARD</Link>
                <button onClick={out} className="label hover:text-bone transition-colors">SIGN OUT</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const input =
  "w-full bg-panel border border-line px-3 py-2.5 text-[15px] text-bone placeholder:text-slate " +
  "focus:outline-none focus:border-mint transition-colors";

const primary =
  "w-full bg-bone text-ink font-mono text-[11px] tracking-[0.18em] py-3 " +
  "hover:bg-mint transition-colors disabled:opacity-40 disabled:hover:bg-bone";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Alert({ children, tone = "bad" }: { children: React.ReactNode; tone?: "bad" | "ok" }) {
  return (
    <p className={`text-sm leading-relaxed border-l-2 pl-3 ${tone === "ok" ? "border-mint text-mint" : "border-ascend text-[#F0A9A4]"}`}>
      {children}
    </p>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="label">{k}</span>
      <span className="font-mono text-[12px] text-bone">{v}</span>
    </div>
  );
}

function roleLabel(a: Access) {
  if (a.staff_role) return a.staff_role.replace(/_/g, " ").toUpperCase();
  if (a.lead_team_name) return `LEAD · ${a.lead_team_name.toUpperCase()}`;
  return "OBSERVER";
}
