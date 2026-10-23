import { Search } from "lucide-react";
import Link from "next/link";
import { OpenPaletteButton, SearchIconLink } from "@/components/search/command-palette-trigger";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NAV_LINKS } from "./nav-links";

/** Sticky public header (docs/design.md 3, Header). */
export function SiteHeader() {
  return (
    // Named so page crossfades leave the header in place (globals.css).
    <header className="sticky top-0 z-40 border-b-3 border-ink bg-paper" style={{ viewTransitionName: "site-header" }}>
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-4 font-display text-sm font-extrabold lg:gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="underline-offset-4 hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Plain GET form so search works without JavaScript; the ⌘K palette enhances it. */}
          <form action="/search" role="search" className="hidden md:block">
            <label htmlFor="header-search" className="sr-only">
              Search articles
            </label>
            <div className="flex h-10 items-center gap-2 rounded-full border-3 border-ink bg-surface px-3">
              <Search aria-hidden="true" className="size-4" strokeWidth={2.5} />
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder="Search articles"
                className="w-28 bg-transparent text-sm outline-none placeholder:text-ink-muted lg:w-44"
              />
              <OpenPaletteButton className="rounded border border-ink px-1 text-[11px] font-semibold hover:bg-cat-events" />
            </div>
          </form>
          <SearchIconLink className="grid size-11 place-items-center rounded-full border-3 border-ink bg-surface shadow-hard md:hidden">
            <Search aria-hidden="true" className="size-5" strokeWidth={2.5} />
            <span className="sr-only">Search</span>
          </SearchIconLink>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
