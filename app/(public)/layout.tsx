import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CommandPaletteTrigger } from "@/components/search/command-palette-trigger";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    // One wrapper: the root <ViewTransition> names its direct children for the
    // page fade, which would replace the header's own name (site-header) and make
    // it fade with the page instead of staying put.
    <div className="flex flex-1 flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:border-3 focus:border-ink focus:bg-cat-events focus:px-4 focus:py-2 focus:font-display focus:font-extrabold"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <CommandPaletteTrigger />
    </div>
  );
}
