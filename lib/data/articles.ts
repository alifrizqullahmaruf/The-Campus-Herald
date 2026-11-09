// Data access for articles. Pages and components must read articles through these
// functions only. Each reads PostgreSQL and is cached until Phase 4 invalidates it with
// updateTag; the tags are "articles" and "users", since author names are shown too.

import { cacheLife, cacheTag } from "next/cache";
import { getCategoryById, getCategoryBySlug } from "../categories";
import { sql } from "../db";
import { readingMinutes } from "../reading-time";
import { matchesQuery } from "../search";
import type { ArticleStatus, ArticleWithRelations, CategorySlug } from "../types";
import { isValidId } from "./ids";

export interface ArticleListOptions {
  category?: CategorySlug;
  limit?: number;
  offset?: number;
}

interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  cover_image: string | null;
  cover_credit_name: string | null;
  cover_credit_profile_url: string | null;
  cover_credit_photo_url: string | null;
  cover_credit_source: string | null;
  status: ArticleStatus;
  review_note: string | null;
  view_count: number;
  author_id: number;
  reviewer_id: number | null;
  category_id: number;
  created_at: Date;
  submitted_at: Date | null;
  published_at: Date | null;
  author_name: string;
  author_bio: string;
  author_beat: string;
}

// The author's public fields only: never email, role or password_hash.
const columns = sql`
  a.id, a.title, a.slug, a.body, a.excerpt, a.cover_image,
  a.cover_credit_name, a.cover_credit_profile_url, a.cover_credit_photo_url, a.cover_credit_source,
  a.status, a.review_note, a.view_count, a.author_id, a.reviewer_id, a.category_id,
  a.created_at, a.submitted_at, a.published_at,
  u.name as author_name, u.bio as author_bio, u.beat as author_beat`;
const from = sql`articles a join users u on u.id = a.author_id`;
// Ties go to the lower id, as the sample data was ordered. An article without a date
// sorts last (PostgreSQL would put NULL first in a descending order).
const newestFirst = sql`a.published_at desc nulls last, a.id`;

// PostgreSQL rejects a negative limit or offset.
function count(n: number): number {
  return Math.max(0, Math.trunc(n));
}

function toArticle(row: ArticleRow): ArticleWithRelations {
  const { id, name, slug } = getCategoryById(row.category_id);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    body: row.body,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    coverCredit:
      row.cover_credit_name === null
        ? null
        : {
            name: row.cover_credit_name,
            profileUrl: row.cover_credit_profile_url ?? "",
            photoUrl: row.cover_credit_photo_url ?? "",
            source: "Unsplash",
          },
    status: row.status,
    reviewNote: row.review_note,
    viewCount: row.view_count,
    authorId: row.author_id,
    reviewerId: row.reviewer_id,
    categoryId: row.category_id,
    createdAt: row.created_at.toISOString(),
    submittedAt: row.submitted_at?.toISOString() ?? null,
    publishedAt: row.published_at?.toISOString() ?? null,
    category: { id, name, slug },
    author: { id: row.author_id, name: row.author_name, bio: row.author_bio, beat: row.author_beat },
    readingMinutes: readingMinutes(row.body),
  };
}

/** Published articles, newest first. */
export async function getPublishedArticles({
  category,
  limit,
  offset = 0,
}: ArticleListOptions = {}): Promise<ArticleWithRelations[]> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "users");
  const categoryId = category ? getCategoryBySlug(category)?.id : undefined;
  const rows = await sql<ArticleRow[]>`
    select ${columns} from ${from}
    where a.status = 'published'
      ${categoryId === undefined ? sql`` : sql`and a.category_id = ${categoryId}`}
    order by ${newestFirst}
    ${limit === undefined ? sql`` : sql`limit ${count(limit)}`}
    offset ${count(offset)}`;
  return rows.map(toArticle);
}

/** A published article by slug, or null. Drafts and pending articles are never public. */
export async function getArticleBySlug(slug: string): Promise<ArticleWithRelations | null> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "users");
  const [row] = await sql<ArticleRow[]>`
    select ${columns} from ${from} where a.status = 'published' and a.slug = ${slug}`;
  return row ? toArticle(row) : null;
}

/** Published articles ordered by view count, for the Most read widget. */
export async function getMostRead(limit = 5): Promise<ArticleWithRelations[]> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "users");
  const rows = await sql<ArticleRow[]>`
    select ${columns} from ${from} where a.status = 'published'
    order by a.view_count desc, ${newestFirst} limit ${count(limit)}`;
  return rows.map(toArticle);
}

/** Case-insensitive search over title and excerpt of published articles. */
export async function searchArticles(
  query: string,
  category?: CategorySlug,
): Promise<ArticleWithRelations[]> {
  // The matching rule is shared with the browser (lib/search.ts), so it runs here
  // over the cached list rather than in SQL.
  const list = await getPublishedArticles({ category });
  return list.filter((article) => matchesQuery(article, query));
}

/** The newer and older published neighbours of an article, for prev/next links. */
export async function getAdjacentArticles(slug: string): Promise<{
  newer: ArticleWithRelations | null;
  older: ArticleWithRelations | null;
}> {
  const list = await getPublishedArticles();
  const index = list.findIndex((article) => article.slug === slug);
  if (index === -1) return { newer: null, older: null };
  return { newer: list[index - 1] ?? null, older: list[index + 1] ?? null };
}

/** Number of published articles per category slug. */
export async function getCategoryCounts(): Promise<Record<CategorySlug, number>> {
  "use cache";
  cacheLife("max");
  cacheTag("articles");
  const counts: Record<CategorySlug, number> = {
    academics: 0,
    organisations: 0,
    events: 0,
    opinion: 0,
    achievements: 0,
  };
  const rows = await sql<{ category_id: number; count: number }[]>`
    select category_id, count(*)::int as count from articles
    where status = 'published' group by category_id`;
  for (const row of rows) counts[getCategoryById(row.category_id).slug] = row.count;
  return counts;
}

/** Published articles by one author, newest first, for the public author page. */
export async function getPublishedArticlesByAuthor(authorId: number): Promise<ArticleWithRelations[]> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "users");
  if (!isValidId(authorId)) return [];
  const rows = await sql<ArticleRow[]>`
    select ${columns} from ${from} where a.status = 'published' and a.author_id = ${authorId}
    order by ${newestFirst}`;
  return rows.map(toArticle);
}

// Dashboard queries. In Phase 3 these are only callable by a logged-in user.

/** All articles by one author, any status unless filtered, most recently created first. */
export async function getArticlesByAuthor(
  authorId: number,
  status?: ArticleStatus,
): Promise<ArticleWithRelations[]> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "users");
  if (!isValidId(authorId)) return [];
  const rows = await sql<ArticleRow[]>`
    select ${columns} from ${from} where a.author_id = ${authorId}
      ${status === undefined ? sql`` : sql`and a.status = ${status}`}
    order by a.created_at desc, a.id`;
  return rows.map(toArticle);
}

/** Articles waiting for review, oldest submission first. */
export async function getPendingArticles(): Promise<ArticleWithRelations[]> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "users");
  const rows = await sql<ArticleRow[]>`
    select ${columns} from ${from} where a.status = 'pending'
    order by a.submitted_at nulls first, a.id`;
  return rows.map(toArticle);
}

/** Every article in any status, for the admin overview. */
export async function getAllArticles(): Promise<ArticleWithRelations[]> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "users");
  const rows = await sql<ArticleRow[]>`
    select ${columns} from ${from} order by a.created_at desc, a.id`;
  return rows.map(toArticle);
}

/** Any article by id regardless of status, for the editor and the review page. */
export async function getArticleById(id: number): Promise<ArticleWithRelations | null> {
  "use cache";
  cacheLife("max");
  cacheTag("articles", "users");
  if (!isValidId(id)) return null;
  const [row] = await sql<ArticleRow[]>`select ${columns} from ${from} where a.id = ${id}`;
  return row ? toArticle(row) : null;
}
