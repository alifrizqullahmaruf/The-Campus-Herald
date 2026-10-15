import { Search } from "lucide-react";
import { CategoryPill } from "@/components/ui/category-pill";
import { CATEGORIES } from "@/lib/categories";

/** Inline yellow search card (docs/design.md 3, Search). Plain GET form to /search. */
export function SearchBox() {
  return (
    <section
      aria-labelledby="search-box-title"
      className="rounded-card border-3 border-ink bg-cat-events p-5 shadow-hard md:rotate-1"
    >
      <h2 id="search-box-title" className="font-display text-2xl font-black leading-tight">
        Lost something?
        <br />
        Search the archive.
      </h2>
      <form action="/search" role="search" className="mt-4">
        <label htmlFor="search-box-input" className="sr-only">
          Search articles
        </label>
        <div className="flex items-center gap-2 rounded-full border-3 border-ink bg-surface px-4 py-2">
          <Search aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.5} />
          <input
            id="search-box-input"
            name="q"
            type="search"
            placeholder="Try “exam”, “music” or “council”"
            className="w-full bg-transparent outline-none placeholder:text-ink-muted"
          />
        </div>
      </form>
      <p className="mt-4 text-meta">Browse a desk</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <CategoryPill key={category.slug} slug={category.slug} size="sm" />
        ))}
      </div>
    </section>
  );
}
