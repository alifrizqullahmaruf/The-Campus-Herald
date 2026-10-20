import { isCategorySlug } from "@/lib/categories";
import { getPublishedArticles, searchArticles } from "@/lib/data/articles";
import type { SearchResult } from "@/lib/search";

const MAX_RESULTS = 20;

/**
 * GET /api/search?q=...&category=...
 * Used by the ⌘K palette. An empty query returns the newest articles.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").slice(0, 100);
  const categoryParam = params.get("category") ?? "";
  const category = isCategorySlug(categoryParam) ? categoryParam : undefined;

  const articles =
    query.trim() === ""
      ? await getPublishedArticles({ category, limit: 6 })
      : await searchArticles(query, category);

  const results: SearchResult[] = articles.slice(0, MAX_RESULTS).map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    categoryName: article.category.name,
    categorySlug: article.category.slug,
    authorName: article.author.name,
    readingMinutes: article.readingMinutes,
    coverImage: article.coverImage,
  }));

  return Response.json({ results });
}
