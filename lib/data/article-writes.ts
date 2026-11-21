import "server-only";
import type { TransactionSql } from "postgres";
import { slugify } from "../articles/draft-rules";
import { getCategoryBySlug } from "../categories";
import { sql } from "../db";
import { isUploadPath } from "../uploads/paths";
import { deleteUpload } from "../uploads/storage";

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
  /** Checked here: an upload, the article's stored cover, or null. */
  coverImage: string | null;
  coverAlt: string;
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

type Current = {
  author_id: number;
  status: string;
  published_at: Date | null;
  slug: string;
  cover_image: string | null;
};

/**
 * True when `src` is an upload of this author that is still recorded (migration 004): an
 * article never points to someone else's file or to one already deleted. The row is
 * locked, so a save that removes the file waits for this transaction, and the other way round.
 */
async function ownsUpload(tx: Tx, authorId: number, src: string | null): Promise<boolean> {
  if (!src || !isUploadPath(src)) return false;
  const [row] = await tx`select 1 from uploads where path = ${src} and owner_id = ${authorId} for update`;
  return Boolean(row);
}

/**
 * Inside the transaction: forgets a replaced upload that no other article points to and
 * returns its path, so the file is deleted once the transaction is committed.
 */
async function releaseUpload(tx: Tx, src: string | null): Promise<string | null> {
  if (!src || !isUploadPath(src)) return null;
  const [locked] = await tx`select 1 from uploads where path = ${src} for update`;
  if (!locked) return null;
  const [used] = await tx`select 1 from articles where cover_image = ${src} limit 1`;
  if (used) return null;
  await tx`delete from uploads where path = ${src}`;
  return src;
}

async function deleteReleased(src: string | null): Promise<void> {
  if (!src) return;
  await deleteUpload(src).catch((error) => console.error("deleting an old cover failed", error instanceof Error ? error.message : error));
}

/** The alt text is kept only with a cover. */
function altFor(cover: string | null, alt: string): string | null {
  return cover && alt ? alt : null;
}

/** A new article by this author, as a draft or straight to review. Returns its id. */
async function insertArticle(authorId: number, fields: DraftWrite, submit: boolean): Promise<number> {
  return retryOnSlugClash(() =>
    sql.begin(async (tx) => {
      const slug = await freeSlug(tx, fields.title, null);
      // A new article can only point to an upload of its own author.
      const cover = (await ownsUpload(tx, authorId, fields.coverImage)) ? fields.coverImage : null;
      const [row] = await tx<{ id: number }[]>`
        insert into articles (title, slug, body, excerpt, cover_image, cover_alt, status, submitted_at, author_id, category_id)
        values (${fields.title}, ${slug}, ${fields.body}, ${fields.summary}, ${cover}, ${altFor(cover, fields.coverAlt)},
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
  let replaced: string | null = null;
  const result = await retryOnSlugClash(() =>
    sql.begin(async (tx) => {
      const [current] = await tx<Current[]>`
        select author_id, status, published_at, slug, cover_image from articles where id = ${id} for update`;
      if (!current || current.author_id !== authorId || !allowed.includes(current.status)) return null;
      // Once an article has been public, its address stays the same.
      const slug = current.published_at === null ? await freeSlug(tx, fields.title, id) : current.slug;
      // The cover it has, none, or a new upload of this author. Anything else (an address
      // from somewhere else, someone else's file, or a file a save in another tab already
      // removed) leaves the stored cover as it is.
      const wanted = fields.coverImage;
      const cover =
        wanted === current.cover_image || wanted === null || (await ownsUpload(tx, authorId, wanted))
          ? wanted
          : current.cover_image;
      const changed = cover !== current.cover_image;
      await tx`
        update articles
        set title = ${fields.title}, slug = ${slug}, body = ${fields.body}, excerpt = ${fields.summary},
            category_id = ${categoryId(fields.categorySlug)},
            cover_image = ${cover}, cover_alt = ${altFor(cover, fields.coverAlt)}
            ${changed ? tx`, cover_credit_name = null, cover_credit_profile_url = null, cover_credit_photo_url = null, cover_credit_source = null` : tx``}
            ${submit ? tx`, status = 'pending', submitted_at = now()` : tx``}
        where id = ${id}`;
      replaced = changed ? await releaseUpload(tx, current.cover_image) : null;
      return id;
    }),
  );
  // After the commit: the file of the replaced upload, if no article points to it any more.
  if (result !== null) await deleteReleased(replaced);
  return result;
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
