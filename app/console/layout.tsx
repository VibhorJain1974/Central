import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { Mark } from "@/components/Mark";
import { ConsoleNav, SignOut } from "@/components/ConsoleChrome";
import type { Access } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/enrol");

  const { data } = await supabase.rpc("my_access");
  const access = (data ?? null) as Access | null;

  // Signed in but central does not know them yet: send them back to redeem a code.
  const enrolled = !!access && (!!access.staff_role || !!access.lead_of || access.can_view_all);
  if (!enrolled) redirect("/enrol");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/console" className="flex items-center gap-3 shrink-0">
            <Mark size={26} />
            <div className="hidden sm:block">
              <div className="font-display font-bold tracking-[0.2em] text-[12px] leading-none">AARVAK CENTRAL</div>
              <div className="label mt-1">CONSOLE</div>
            </div>
          </Link>

          <ConsoleNav access={access!} />

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:block text-right">
              <div className="font-mono text-[11px] text-bone leading-none">{access!.display_name ?? "—"}</div>
              <div className="label mt-1">{roleLabel(access!)}</div>
            </div>
            <SignOut />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <Link href="/" className="label hover:text-bone transition-colors">&larr; PUBLIC BOARD</Link>
          <span className="label">TSJ 2026</span>
        </div>
      </footer>
    </div>
  );
}

function roleLabel(a: Access) {
  if (a.staff_role) return a.staff_role.replace(/_/g, " ").toUpperCase();
  if (a.lead_team_name) return `LEAD · ${a.lead_team_name.toUpperCase()}`;
  return "OBSERVER";
}
