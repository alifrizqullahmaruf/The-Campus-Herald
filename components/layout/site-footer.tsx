import Link from "@/components/ui/link";
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

// Rest poses before the pills drop (and with reduced motion): two staggered rows
// along the top; on phones three rows (`phone`, below sm, see globals.css) with
// more room above the wordmark, so no two pills overlap. `pad` is half the pill
// (tilted): the pose is kept that far from the edges. Classes are written out in
// full so Tailwind generates them.
const REST = [
  { left: 10, top: 8, rotate: -6, pad: "[--rest-pad:60px]", phone: "[--rest-left-sm:20%] [--rest-top-sm:5%]" },
  { left: 30, top: 22, rotate: 5, pad: "[--rest-pad:82px]", phone: "[--rest-left-sm:28%] [--rest-top-sm:24%]" },
  { left: 50, top: 8, rotate: -3, pad: "[--rest-pad:67px]", phone: "[--rest-left-sm:50%] [--rest-top-sm:43%]" },
  { left: 70, top: 22, rotate: 6, pad: "[--rest-pad:58px]", phone: "[--rest-left-sm:75%] [--rest-top-sm:5%]" },
  { left: 90, top: 8, rotate: -5, pad: "[--rest-pad:64px]", phone: "[--rest-left-sm:85%] [--rest-top-sm:24%]" },
];

/**
 * Ink footer: the navigation pills fall onto the oversized wordmark when the
 * footer scrolls into view, and can be dragged (template footer).
 */
export function SiteFooter() {
  const pills: PileItem[] = FOOTER_LINKS.map((link, i) => ({
    key: link.href,
    rest: REST[i],
    className: `${REST[i].pad} ${REST[i].phone}`,
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
      <div className="mx-auto w-full max-w-[1120px] px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        <nav aria-label="Footer">
          <PhysicsPile items={pills} list="Footer links" start="view" className="pt-48 sm:pt-32 md:pt-36">
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
            {/* Under the wordmark, so the pills never cover it; also something to land on. */}
            <p aria-hidden="true" data-physics-obstacle className="mt-4 ml-auto w-fit -rotate-3 rounded-full border-2 border-paper px-3 py-1 text-meta">
              Drag the links, they&apos;re real.
            </p>
          </PhysicsPile>
        </nav>

        <div className="mt-8 flex flex-col gap-2 border-t-2 border-paper/30 pt-4 text-meta sm:flex-row sm:justify-between">
          <p>© 2026 Side Notes · A community blog by The Campus Herald</p>
          <Link href="/login" className="tap-target self-start underline underline-offset-4">
            Author log in
          </Link>
        </div>
      </div>
    </footer>
  );
}
