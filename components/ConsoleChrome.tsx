"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { Access } from "@/lib/types";

export function ConsoleNav({ access }: { access: Access }) {
  const path = usePathname();
  const canSeeAnalytics = access.staff_role === "em_head" || access.staff_role === "secretary";
  const items: { href: string; label: string; show: boolean }[] = [
    { href: "/console", label: "OVERVIEW", show: true },
    { href: "/console/team", label: "MY TEAM", show: !!access.lead_of },
    { href: "/console/review", label: "REVIEW", show: access.can_approve || access.can_view_all },
    { href: "/console/adjust", label: "ADJUST", show: access.can_approve },
    { href: "/console/publish", label: "PUBLISH", show: access.can_publish },
    { href: "/console/members", label: "MEMBERS", show: access.can_view_all },
    { href: "/console/analytics", label: "ANALYTICS", show: canSeeAnalytics },
    { href: "/console/health", label: "FEEDS", show: access.can_view_all },
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {items.filter((i) => i.show).map((i) => {
        const on = i.href === "/console" ? path === "/console" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href}
                className={`font-mono text-[10px] tracking-[0.16em] px-3 py-2 whitespace-nowrap transition-colors ${
                  on ? "text-ink bg-bone" : "text-slate hover:text-bone"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SignOut() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await supabaseBrowser().auth.signOut(); router.replace("/enrol"); router.refresh(); }}
      className="label hover:text-bone transition-colors">
      SIGN OUT
    </button>
  );
}
