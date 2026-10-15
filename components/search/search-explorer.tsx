"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/article/article-card";
import { CATEGORIES, isCategorySlug } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { matchesQuery } from "@/lib/search";
import type { ArticleWithRelations, CategorySlug } from "@/lib/types";

/**
 * Live search over the published archive. Every card stays on the wall;
 * non-matching ones fade to 30% and are hidden from assistive tech.
 */
export function SearchExplorer({
  articles,
  initialQuery,
  initialCategory,
}: {
  articles: ArticleWithRelations[];
  initialQuery: string;
  initialCategory: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategorySlug | null>(
    isCategorySlug(initialCategory) ? initialCategory : null,
  );

  const matches = useMemo(
    () =>
      new Set(
        articles
          .filter((a) => (category === null || a.category.slug === category) && matchesQuery(a, query))
          .map((a) => a.id),
      ),
    [articles, category, query],
  );

  // Keep the URL shareable without triggering a navigation.
  function syncUrl(nextQuery: string, nextCategory: CategorySlug | null) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory) params.set("category", nextCategory);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `/search?${search}` : "/search");
  }

  return (
    <>
      <form
        role="search"
        action="/search"
        onSubmit={(event) => event.preventDefault()}
        className="mt-8 rounded-card border-3 border-ink bg-cat-events p-4 shadow-hard md:p-5"
      >
        <label htmlFor="search-page-input" className="sr-only">
          Search articles
        </label>
        <div className="flex items-center gap-3 rounded-full border-3 border-ink bg-surface px-4 py-3">
          <Search aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.5} />
          <input
            id="search-page-input"
            name="q"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              syncUrl(event.target.value, category);
            }}
            placeholder="Search titles and summaries"
            className="w-full bg-transparent font-display text-lg font-extrabold outline-none placeholder:font-sans placeholder:font-normal placeholder:text-ink-muted"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <FilterButton active={category === null} onClick={() => { setCategory(null); syncUrl(query, null); }}>
            All
          </FilterButton>
          {CATEGORIES.map((c) => (
            <FilterButton
              key={c.slug}
              active={category === c.slug}
              className={cx(c.bgClass, c.textClass)}
              onClick={() => {
                const next = category === c.slug ? null : c.slug;
                setCategory(next);
                syncUrl(query, next);
              }}
            >
              {c.name}
            </FilterButton>
          ))}
        </div>
      </form>

      <p aria-live="polite" className="mt-8 text-meta">
        {matches.size} of {articles.length} articles
        {query.trim() && ` match “${query.trim()}”`}
      </p>

      {matches.size === 0 && (
        <p className="mt-4 rounded-card border-3 border-ink bg-surface p-5 shadow-hard">
          Nothing found. Try a shorter word, or clear the category filter.
        </p>
      )}

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => {
          const hit = matches.has(article.id);
          return (
            <li
              key={article.id}
              aria-hidden={!hit}
              inert={!hit}
              className={cx("flex transition-opacity duration-200", !hit && "opacity-30 grayscale")}
            >
              <ArticleCard article={article} className="w-full" headingLevel="h2" />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function FilterButton({
  active,
  className,
  onClick,
  children,
}: {
  active: boolean;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "rounded-full border-2 border-ink px-3 py-1 font-display text-sm font-extrabold",
        className ?? "bg-surface",
        active ? "shadow-hard outline-2 outline-offset-2 outline-ink outline-dashed" : "opacity-80",
      )}
    >
      {children}
    </button>
  );
}
