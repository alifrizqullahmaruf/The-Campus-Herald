import Link from "next/link";
import { NAV_LINKS } from "./nav-links";

const FOOTER_LINKS = [...NAV_LINKS, { href: "/search", label: "Search" }];

const PILL_COLOURS = [
  "bg-cat-events",
  "bg-cat-academics text-white",
  "bg-cat-opinion",
  "bg-surface",
  "bg-cat-organisations",
];

/** Ink footer with an oversized wordmark (docs/design.md 3, Footer). */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-3 border-ink bg-ink text-paper">
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-3">
            {FOOTER_LINKS.map((link, i) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`inline-block rounded-full border-3 border-paper px-4 py-1.5 font-display text-sm font-extrabold text-ink ${PILL_COLOURS[i % PILL_COLOURS.length]}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p
          aria-hidden="true"
          className="mt-10 font-display text-[clamp(56px,15vw,200px)] font-black uppercase leading-[0.85]"
        >
          Side
          <br />
          <span className="text-cat-opinion">Notes</span>
        </p>

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
