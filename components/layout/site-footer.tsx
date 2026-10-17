import Link from "next/link";
import { PhysicsPile, type PileItem } from "@/components/physics/physics-pile";
import { NAV_LINKS } from "./nav-links";

const FOOTER_LINKS = [...NAV_LINKS, { href: "/search", label: "Search" }];

const PILL_COLOURS = [
  "bg-cat-events",
  "bg-cat-academics text-white",
  "bg-cat-opinion",
  "bg-surface",
  "bg-cat-organisations",
];

// Rest poses before the pills drop (and with reduced motion): along the top.
const REST = [
  { left: 8, top: 10, rotate: -6 },
  { left: 24, top: 8, rotate: 5 },
  { left: 40, top: 11, rotate: -3 },
  { left: 55, top: 8, rotate: 8 },
  { left: 70, top: 10, rotate: -5 },
];

/**
 * Ink footer: the navigation pills fall onto the oversized wordmark when the
 * footer scrolls into view, and can be dragged (template footer).
 */
export function SiteFooter() {
  const pills: PileItem[] = FOOTER_LINKS.map((link, i) => ({
    key: link.href,
    rest: REST[i],
    node: (
      <Link
        href={link.href}
        draggable={false}
        className={`inline-block rounded-full border-3 border-paper px-5 py-2 font-display text-base font-extrabold whitespace-nowrap text-ink shadow-[4px_4px_0_0_var(--color-paper)] ${PILL_COLOURS[i % PILL_COLOURS.length]}`}
      >
        {link.label}
      </Link>
    ),
  }));

  return (
    <footer className="mt-auto overflow-x-clip border-t-3 border-ink bg-ink text-paper">
      <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        <nav aria-label="Footer">
          <PhysicsPile items={pills} list="Footer links" start="view" className="pt-32 md:pt-36">
            <p aria-hidden="true" className="absolute top-2 right-0 -rotate-3 rounded-full border-2 border-paper px-3 py-1 text-meta">
              Drag the links, they&apos;re real.
            </p>
            <p
              aria-hidden="true"
              className="pointer-events-none font-display text-[clamp(56px,15vw,200px)] leading-[0.85] font-black uppercase"
            >
              <span className="inline-block" data-physics-obstacle>
                Side
              </span>
              <br />
              <span className="inline-block text-cat-opinion" data-physics-obstacle>
                Notes
              </span>
            </p>
          </PhysicsPile>
        </nav>

        <div className="mt-8 flex flex-col gap-2 border-t-2 border-paper/30 pt-4 text-meta sm:flex-row sm:justify-between">
          <p>© 2026 Side Notes · A community blog by The Campus Herald</p>
          <Link href="/login" className="underline underline-offset-4">
            Author log in
          </Link>
        </div>
      </div>
    </footer>
  );
}
