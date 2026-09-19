import Link from "next/link";
import Image from "next/image";
import { Mark } from "@/components/Mark";
import { TEAMS, metaOf } from "@/lib/teams";

/* ---------------------------------------------------------------- shell */

export function SiteHeader({ active }: { active?: string }) {
  const nav = [
    { href: "/", label: "BOARD" },
    { href: "/teams", label: "TEAMS" },
    { href: "/people", label: "PEOPLE" },
    { href: "/record", label: "THE RECORD" },
    { href: "/rules", label: "RULES" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Mark size={26} />
          <span className="font-display font-bold tracking-[0.2em] text-[13px] hidden sm:block">
            AARVAK CENTRAL
          </span>
        </Link>
        <nav className="flex items-center gap-5 overflow-x-auto">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
                  className={`label whitespace-nowrap transition-colors ${
                    active === n.href ? "text-bone" : "hover:text-bone"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/enrol"
              className="font-mono text-[10px] tracking-[0.18em] border border-line px-3 py-2 hover:border-mint hover:text-mint transition-colors shrink-0">
          CONSOLE
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="flex flex-col sm:flex-row gap-8 justify-between">
          <div className="flex items-center gap-3">
            <Mark size={28} />
            <div>
              <div className="font-display font-bold tracking-[0.2em] text-[13px]">AARVAK</div>
              <div className="label mt-1">TECH SPRINT JOURNEY 2026</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {TEAMS.map((t) => (
              <Link key={t.slug} href={`/team/${t.slug}`}
                    className="label hover:text-bone transition-colors flex items-center gap-2">
                <i className="w-[6px] h-[6px]" style={{ background: t.accent }} />
                {t.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-line flex flex-col sm:flex-row justify-between gap-2">
          <span className="label">VIPS-TC &middot; GGSIPU &middot; NEW DELHI</span>
          <span className="label">EVERY NUMBER HERE CAME FROM A VERIFIED SUBMISSION</span>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------------------------------------- pieces */

export function Section({ n, title, sub, right }: {
  n?: string; title: string; sub?: string; right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10 rise">
      <div className="max-w-2xl">
        {n && <div className="label text-mint">{n}</div>}
        <h2 className="font-display font-bold text-[38px] sm:text-[52px] leading-[0.9] tracking-tight mt-2">
          {title}
        </h2>
        {sub && <p className="mt-4 text-ash leading-relaxed">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Figure({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`figure text-[34px] sm:text-[40px] ${accent ? "text-mint" : "text-bone"}`}>{value}</div>
      <div className="label mt-1.5">{label}</div>
    </div>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel p-8 sm:p-12">
      <div className="label text-mint">NOTHING HERE YET</div>
      <h3 className="font-display font-bold text-[28px] sm:text-[38px] leading-none tracking-tight mt-4">{title}</h3>
      <p className="mt-4 max-w-2xl text-ash leading-relaxed">{body}</p>
    </div>
  );
}

/** The team's own artwork, cropped to a band with its focal point respected.
 *  `variant="hero"` picks the crop that leaves room for the team name, for the
 *  two teams whose poster is the name. */
export function TeamArt({ slug, className = "", priority = false, variant = "card" }: {
  slug: string; className?: string; priority?: boolean; variant?: "card" | "hero";
}) {
  const m = metaOf(slug);
  if (!m) return null;
  const src = variant === "hero" ? (m.hero ?? m.art) : m.art;
  const pos = variant === "hero" ? (m.heroFocal ?? m.focal) : m.focal;
  return (
    <Image src={src} alt={`${m.name} artwork`} fill priority={priority}
           sizes="(max-width: 768px) 100vw, 1400px"
           className={`object-cover ${className}`} style={{ objectPosition: pos }} />
  );
}

/** Square emblem where the team has one, their wordmark where they do not. */
export function TeamLogo({ slug, size = 112 }: { slug: string; size?: number }) {
  const m = metaOf(slug);
  if (!m) return null;
  if (m.mark) {
    return (
      <div className="relative shrink-0 border border-line overflow-hidden"
           style={{ width: size, height: size }}>
        <Image src={m.mark} alt={m.name} fill sizes={`${size}px`} className="object-cover" />
      </div>
    );
  }
  return (
    <div className="relative shrink-0 border border-line overflow-hidden"
         style={{ width: size * 2.2, height: size * 0.62 }}>
      <Image src={m.word!} alt={m.name} fill sizes={`${Math.round(size * 2.2)}px`} className="object-cover" />
    </div>
  );
}

export function Dot({ slug, size = 9 }: { slug: string; size?: number }) {
  const m = metaOf(slug);
  return <i className="inline-block shrink-0" style={{ width: size, height: size, background: m?.accent ?? "#A49AEA" }} />;
}

/* ---------------------------------------------------------------- utils */

export function stamp(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).toUpperCase();
}

export function day(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }).toUpperCase();
}

export function movementText(m: number) {
  if (!m) return "NO CHANGE";
  return m > 0 ? `▲ UP ${m}` : `▼ DOWN ${Math.abs(m)}`;
}
