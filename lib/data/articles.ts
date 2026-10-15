// Data access for articles. Pages and components must read articles through
// these functions only. In Phase 2 the bodies are replaced by database queries;
// the signatures stay the same.

import { getCategoryById, getCategoryBySlug } from "../categories";
import { MOCK_ARTICLES } from "../mock/articles";
import { MOCK_USERS } from "../mock/users";
import { matchesQuery } from "../search";
import type {
  Article,
  ArticleStatus,
  ArticleWithRelations,
  CategorySlug,
} from "../types";

const WORDS_PER_MINUTE = 200;

function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function withRelations(article: Article): ArticleWithRelations {
  const author = MOCK_USERS.find((user) => user.id === article.authorId);
  if (!author) throw new Error(`Unknown author id: ${article.authorId}`);
  const { id, name, slug } = getCategoryById(article.categoryId);
  return {
    ...article,
    category: { id, name, slug },
    author: { id: author.id, name: author.name, bio: author.bio, beat: author.beat },
    readingMinutes: readingMinutes(article.body),
  };
}

function published(): Article[] {
  return MOCK_ARTICLES.filter((article) => article.status === "published").sort(
    (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
  );
}

export interface ArticleListOptions {
  category?: CategorySlug;
  limit?: number;
  offset?: number;
}

/** Published articles, newest first. */
export async function getPublishedArticles({
  category,
  limit,
  offset = 0,
}: ArticleListOptions = {}): Promise<ArticleWithRelations[]> {
  const categoryId = category ? getCategoryBySlug(category)?.id : undefined;
  const list = published().filter(
    (article) => categoryId === undefined || article.categoryId === categoryId,
  );
  const end = limit === undefined ? undefined : offset + limit;
  return list.slice(offset, end).map(withRelations);
}

/** A published article by slug, or null. Drafts and pending articles are never public. */
export async function getArticleBySlug(
  slug: string,
): Promise<ArticleWithRelations | null> {
  const article = published().find((a) => a.slug === slug);
  return article ? withRelations(article) : null;
}

/** Published articles ordered by view count, for the Most read widget. */
export async function getMostRead(limit = 5): Promise<ArticleWithRelations[]> {
  return [...published()]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit)
    .map(withRelations);
}

/** Case-insensitive search over title and excerpt of published articles. */
export async function searchArticles(
  query: string,
  category?: CategorySlug,
): Promise<ArticleWithRelations[]> {
  const categoryId = category ? getCategoryBySlug(category)?.id : undefined;
  return published()
    .filter((article) => categoryId === undefined || article.categoryId === categoryId)
    .filter((article) => matchesQuery(article, query))
    .map(withRelations);
}

/** The newer and older published neighbours of an article, for prev/next links. */
export async function getAdjacentArticles(slug: string): Promise<{
  newer: ArticleWithRelations | null;
  older: ArticleWithRelations | null;
}> {
  const list = published();
  const index = list.findIndex((article) => article.slug === slug);
  if (index === -1) return { newer: null, older: null };
  const newer = list[index - 1];
  const older = list[index + 1];
  return {
    newer: newer ? withRelations(newer) : null,
    older: older ? withRelations(older) : null,
  };
}

/** Number of published articles per category slug. */
export async function getCategoryCounts(): Promise<Record<CategorySlug, number>> {
  const counts: Record<CategorySlug, number> = {
    academics: 0,
    organisations: 0,
    events: 0,
    opinion: 0,
    achievements: 0,
  };
  for (const article of published()) {
    counts[getCategoryById(article.categoryId).slug] += 1;
  }
  return counts;
}

// Dashboard queries. In Phase 3 these are only callable by a logged-in user.

/** All articles by one author, any status unless filtered, most recently created first. */
export async function getArticlesByAuthor(
  authorId: number,
  status?: ArticleStatus,
): Promise<ArticleWithRelations[]> {
  return MOCK_ARTICLES.filter(
    (article) =>
      article.authorId === authorId && (status === undefined || article.status === status),
  )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(withRelations);
}

/** Articles waiting for review, oldest submission first. */
export async function getPendingArticles(): Promise<ArticleWithRelations[]> {
  return MOCK_ARTICLES.filter((article) => article.status === "pending")
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""))
    .map(withRelations);
}

/** Every article in any status, for the admin overview. */
export async function getAllArticles(): Promise<ArticleWithRelations[]> {
  return [...MOCK_ARTICLES]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(withRelations);
}

/** Any article by id regardless of status, for the editor and the review page. */
export async function getArticleById(id: number): Promise<ArticleWithRelations | null> {
  const article = MOCK_ARTICLES.find((a) => a.id === id);
  return article ? withRelations(article) : null;
}
