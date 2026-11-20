import "server-only";
import type { TransactionSql } from "postgres";
import { slugify } from "../articles/draft-rules";
import { getCategoryBySlug } from "../categories";
import { sql } from "../db";

// Writes to the articles table (Phase 4, docs/plans/2026-11-17-fase-4-alur-kerja.md). Only
// the Server Actions in lib/articles/actions.ts call these, after checking the user and
// sanitising the body. Never cached: every write reads the row it changes fresh, and the
// caller expires the "articles" cache tag afterwards.

export interface DraftWrite {
  title: string;
  summary: string;
  categorySlug: string;
  /** Already sanitised. */
  body: string;
}

type Tx = TransactionSql;

/** The statuses a draft save may change, and those an author may submit from. */
const DRAFT_STATUSES = ["draft", "rejected"] as const;
const SUBMIT_STATUSES = ["draft", "rejected", "published"] as const;
const UNIQUE_VIOLATION = "23505";

function categoryId(slug: string): number {
  const category = getCategoryBySlug(slug);
  if (!category) throw new Error(`Unknown category: ${slug}`);
  return category.id;
}

/** `base`, or `base-2`, `base-3`… : the first one no other article uses. */
async function freeSlug(tx: Tx, title: string, exceptId: number | null): Promise<string> {
  const base = slugify(title);
  const rows = await tx<{ slug: string }[]>`
    select slug from articles
    where (slug = ${base} or slug like ${`${base}-%`})
      ${exceptId === null ? tx`` : tx`and id <> ${exceptId}`}`;
  const taken = new Set(rows.map((row) => row.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

/** Two saves at the same moment can pick the same free slug; the later one tries again. */
async function retryOnSlugClash<T>(write: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await write();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== UNIQUE_VIOLATION || attempt >= 3) throw error;
    }
  }
}

type Current = { author_id: number; status: string; published_at: Date | null; slug: string };

/** A new article by this author, as a draft or straight to review. Returns its id. */
async function insertArticle(authorId: number, fields: DraftWrite, submit: boolean): Promise<number> {
  return retryOnSlugClash(() =>
    sql.begin(async (tx) => {
      const slug = await freeSlug(tx, fields.title, null);
      const [row] = await tx<{ id: number }[]>`
        insert into articles (title, slug, body, excerpt, status, submitted_at, author_id, category_id)
        values (${fields.title}, ${slug}, ${fields.body}, ${fields.summary},
                ${submit ? "pending" : "draft"}, ${submit ? tx`now()` : null}, ${authorId},
                ${categoryId(fields.categorySlug)})
        returning id`;
      return row.id;
    }),
  );
}

/**
 * Changes an article if it is this author's and in one of `allowed`; with `submit` it goes
 * to review. Returns null when the article does not exist, is someone else's, or is in
 * another status: the caller answers all of these the same way.
 */
async function changeArticle(
  authorId: number,
  id: number,
  fields: DraftWrite,
  allowed: readonly string[],
  submit: boolean,
): Promise<number | null> {
  return retryOnSlugClash(() =>
    sql.begin(async (tx) => {
      const [current] = await tx<Current[]>`
        select author_id, status, published_at, slug from articles where id = ${id} for update`;
      if (!current || current.author_id !== authorId || !allowed.includes(current.status)) return null;
      // Once an article has been public, its address stays the same.
      const slug = current.published_at === null ? await freeSlug(tx, fields.title, id) : current.slug;
      await tx`
        update articles
        set title = ${fields.title}, slug = ${slug}, body = ${fields.body}, excerpt = ${fields.summary},
            category_id = ${categoryId(fields.categorySlug)}
            ${submit ? tx`, status = 'pending', submitted_at = now()` : tx``}
        where id = ${id}`;
      return id;
    }),
  );
}

/** A new draft by this author. Returns its id. */
export async function createDraft(authorId: number, fields: DraftWrite): Promise<number> {
  return insertArticle(authorId, fields, false);
}

/** Saves the author's own draft or article sent back, keeping its status (null: see changeArticle). */
export async function updateDraft(authorId: number, id: number, fields: DraftWrite): Promise<number | null> {
  return changeArticle(authorId, id, fields, DRAFT_STATUSES, false);
}

/**
 * Sends an article to the editor: a new one (`id` null), or the author's own draft, article
 * sent back, or published article, which leaves the site until it is approved again. Its
 * slug and first publication date stay. Returns null as changeArticle does.
 */
export async function submitArticle(authorId: number, id: number | null, fields: DraftWrite): Promise<number | null> {
  return id === null ? insertArticle(authorId, fields, true) : changeArticle(authorId, id, fields, SUBMIT_STATUSES, true);
}

export type ReviewDecision = { approve: true } | { approve: false; note: string };

/**
 * The administrator's decision on an article waiting for review. Approving publishes it:
 * the first publication date stays (a changed published article keeps its place), and a
 * new article is dated now. Sending it back stores the note. The reviewer is recorded
 * either way. Returns null when the article does not exist or is not waiting for review.
 */
export async function reviewArticle(reviewerId: number, id: number, decision: ReviewDecision): Promise<number | null> {
  return sql.begin(async (tx) => {
    const [current] = await tx<{ status: string }[]>`select status from articles where id = ${id} for update`;
    if (!current || current.status !== "pending") return null;
    if (decision.approve) {
      await tx`
        update articles
        set status = 'published', review_note = null, reviewer_id = ${reviewerId},
            published_at = coalesce(published_at, now())
        where id = ${id}`;
    } else {
      await tx`
        update articles
        set status = 'rejected', review_note = ${decision.note}, reviewer_id = ${reviewerId}
        where id = ${id}`;
    }
    return id;
  });
}
