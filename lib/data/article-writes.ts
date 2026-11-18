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

/** The statuses an author may still change. */
const EDITABLE = ["draft", "rejected"];
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

/** A new draft by this author. Returns its id. */
export async function createDraft(authorId: number, fields: DraftWrite): Promise<number> {
  return retryOnSlugClash(() =>
    sql.begin(async (tx) => {
      const slug = await freeSlug(tx, fields.title, null);
      const [row] = await tx<{ id: number }[]>`
        insert into articles (title, slug, body, excerpt, status, author_id, category_id)
        values (${fields.title}, ${slug}, ${fields.body}, ${fields.summary}, 'draft', ${authorId},
                ${categoryId(fields.categorySlug)})
        returning id`;
      return row.id;
    }),
  );
}

/**
 * Saves an article its author may still change (a draft, or one sent back), keeping its
 * status. Returns null when the article does not exist, is someone else's, or is pending
 * or published: the caller answers all of these the same way.
 */
export async function updateDraft(authorId: number, id: number, fields: DraftWrite): Promise<number | null> {
  return retryOnSlugClash(() =>
    sql.begin(async (tx) => {
      const [current] = await tx<{ author_id: number; status: string; published_at: Date | null; slug: string }[]>`
        select author_id, status, published_at, slug from articles where id = ${id} for update`;
      if (!current || current.author_id !== authorId || !EDITABLE.includes(current.status)) return null;
      // Once an article has been public, its address stays the same.
      const slug = current.published_at === null ? await freeSlug(tx, fields.title, id) : current.slug;
      await tx`
        update articles
        set title = ${fields.title}, slug = ${slug}, body = ${fields.body}, excerpt = ${fields.summary},
            category_id = ${categoryId(fields.categorySlug)}
        where id = ${id}`;
      return id;
    }),
  );
}
