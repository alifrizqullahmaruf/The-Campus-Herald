import type { Article } from "./types";

/**
 * The one matching rule used by the server (lib/data) and the browser
 * (search page, palette), so both agree on what a match is.
 * Case-insensitive substring match on title and excerpt; empty query matches all.
 */
export function matchesQuery(article: Pick<Article, "title" | "excerpt">, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return article.title.toLowerCase().includes(needle) || article.excerpt.toLowerCase().includes(needle);
}

/** Compact search result sent to the browser (no article body). */
export interface SearchResult {
  id: number;
  slug: string;
  title: string;
  categoryName: string;
  categorySlug: string;
  authorName: string;
  readingMinutes: number;
}
