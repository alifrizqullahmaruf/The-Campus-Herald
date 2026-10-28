"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CoverImage } from "@/components/article/article-cover";
import { PAGE_TRANSITION } from "@/components/ui/link";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { SearchResult } from "@/lib/search";
import type { CategorySlug } from "@/lib/types";

/** The full search page for what the palette shows: query and topic carried over. */
function searchPageHref(query: string, category: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (category) params.set("category", category);
  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}

/**
 * Quick-search modal (docs/design.md 3, Search → command palette).
 * Native <dialog> gives focus containment and Esc; the input is an ARIA combobox.
 */
export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategorySlug | "">("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q: query, category });
      try {
        const response = await fetch(`/api/search?${params}`, { signal: controller.signal });
        const data: { results: SearchResult[] } = await response.json();
        setResults(data.results);
        setActive(0);
        setLoaded(true);
      } catch {
        // Aborted by a newer keystroke, or offline: keep the previous results.
      }
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, category]);

  function openResult(result: SearchResult) {
    dialogRef.current?.close();
    router.push(`/articles/${result.slug}`, { transitionTypes: PAGE_TRANSITION });
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      openResult(results[active]);
    }
  }

  const optionId = (i: number) => `${listId}-option-${i}`;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Quick search"
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(event) => event.target === dialogRef.current && dialogRef.current?.close()}
      className="m-auto mt-[10vh] w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-card border-3 border-ink bg-surface p-0 text-ink shadow-hard-lift backdrop:bg-paper/80 backdrop:bg-[radial-gradient(var(--color-ink)_1px,transparent_1px)] backdrop:bg-size-[24px_24px]"
    >
      <div className="flex items-center gap-3 border-b-3 border-ink bg-cat-events px-4 py-3">
        <Search aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.5} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={results[active] ? optionId(active) : undefined}
          aria-autocomplete="list"
          aria-label="Search articles"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Search articles, topics…"
          className="w-full bg-transparent font-display text-lg font-extrabold outline-none placeholder:text-ink/50"
        />
        <button
          type="button"
          aria-label="Close search"
          onClick={() => dialogRef.current?.close()}
          className="tap-target rounded-md border-2 border-ink bg-surface px-1.5 py-0.5 text-meta"
        >
          Esc
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b-2 border-ink/15 px-4 py-3" role="group" aria-label="Filter by category">
        <button
          type="button"
          aria-pressed={category === ""}
          onClick={() => setCategory("")}
          className={cx("tap-target rounded-full border-2 border-ink bg-surface px-2.5 py-0.5 font-display text-xs font-extrabold", category === "" && "outline-2 outline-offset-2 outline-dashed")}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            aria-pressed={category === c.slug}
            onClick={() => setCategory(category === c.slug ? "" : c.slug)}
            className={cx(
              "tap-target rounded-full border-2 border-ink px-2.5 py-0.5 font-display text-xs font-extrabold",
              c.bgClass,
              c.textClass,
              category === c.slug && "outline-2 outline-offset-2 outline-dashed",
            )}
          >
            {c.name}
          </button>
        ))}
        <span aria-live="polite" className="ml-auto text-meta text-ink-muted">
          {loaded ? `${results.length} ${results.length === 1 ? "article" : "articles"}` : "Loading"}
        </span>
      </div>

      <ul id={listId} role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
        {loaded && results.length === 0 && <li className="px-3 py-6 text-center text-ink-muted">No articles match.</li>}
        {results.map((result, i) => {
          const style = getCategoryBySlug(result.categorySlug);
          const selected = i === active;
          return (
            <li
              key={result.id}
              id={optionId(i)}
              role="option"
              aria-selected={selected}
              onMouseEnter={() => setActive(i)}
              onClick={() => openResult(result)}
              className={cx(
                "flex cursor-pointer items-center gap-3 rounded-inner border-2 p-2",
                selected ? cx("border-ink", style?.bgClass, style?.textClass) : "border-transparent",
              )}
            >
              <span className="relative size-10 shrink-0 overflow-hidden rounded-md border-2 border-ink">
                <CoverImage src={result.coverImage} seed={result.id} category={result.categorySlug as CategorySlug} sizes="40px" />
              </span>
              <span className="min-w-0">
                <span className="block text-meta">
                  {result.categoryName} · {result.authorName} · {result.readingMinutes} min
                </span>
                <span className="block truncate font-display font-extrabold">{result.title}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-4 border-t-3 border-ink bg-paper px-4 py-3 text-meta text-ink-muted">
        <span aria-hidden="true" className="flex gap-4 pointer-coarse:hidden">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>Esc to close</span>
        </span>
        <a
          href={searchPageHref(query, category)}
          onClick={(event) => {
            // Let Ctrl/⌘/Shift-click and middle-click open the page elsewhere.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            const href = event.currentTarget.getAttribute("href") ?? "/search";
            dialogRef.current?.close();
            // Already on /search: its explorer keeps its own state (the URL it writes with
            // replaceState never reaches the server), so load the page fresh from the URL.
            if (window.location.pathname === "/search") window.location.assign(href);
            else router.push(href, { transitionTypes: PAGE_TRANSITION });
          }}
          className="tap-target ml-auto text-ink underline underline-offset-4"
        >
          All results →
        </a>
      </div>
    </dialog>
  );
}
