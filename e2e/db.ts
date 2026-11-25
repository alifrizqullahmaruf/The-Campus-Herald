import { unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import postgres from "postgres";
import { slugify } from "../lib/articles/draft-rules";
import { isUploadPath } from "../lib/uploads/paths";

// Direct database access for tests that write: they remove their own rows afterwards, so
// the sample data stays as `npm run db:seed` made it. DATABASE_URL comes from .env.local,
// which playwright.config.ts loads; its value is never printed.

/** The title prefix every row an E2E test creates starts with. */
export const E2E_TITLE = "E2E draft";

/** A title no other test uses, so each test removes only its own rows (tests run in parallel). */
export function uniqueTitle(): string {
  return `${E2E_TITLE} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function withSql<T>(run: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set: run `npm run db:setup`.");
  const sql = postgres(url, { max: 1 });
  try {
    return await run(sql);
  } finally {
    await sql.end();
  }
}

/** An email for an account no other test uses: `e2e-…@herald.test`. */
export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@herald.test`;
}

/** Deletes one test's author account (it has no articles), by its e2e email. */
export async function deleteTestUser(email: string): Promise<void> {
  if (!/^e2e-[a-z0-9-]+@herald\.test$/.test(email)) throw new Error("Only E2E accounts may be deleted.");
  await withSql((sql) => sql`delete from users where email = ${email} and role = 'author'`);
}

/** Deletes uploaded covers a test made (saved with an article or not) and their records. */
export async function deleteTestUploads(paths: string[]): Promise<void> {
  const own = paths.filter(isUploadPath);
  if (own.length === 0) return;
  await withSql((sql) => sql`delete from uploads where path in ${sql(own)}`);
  const folder = resolve(process.env.UPLOADS_DIR || join(process.cwd(), ".data", "uploads"));
  for (const src of own) await unlink(join(folder, src.slice("/uploads/".length))).catch(() => {});
}

/** Deletes the articles whose title starts with `prefix` (one test's own rows). */
export async function deleteTestArticles(prefix: string): Promise<void> {
  if (!prefix.startsWith(`${E2E_TITLE} `)) throw new Error("Only E2E rows may be deleted.");
  const rows = await withSql((sql) => sql<{ cover_image: string | null }[]>`
    delete from articles where starts_with(title, ${prefix}) returning cover_image`);
  // Their uploaded covers too (lib/uploads/storage.ts keeps them in UPLOADS_DIR).
  await deleteTestUploads(rows.flatMap((row) => (row.cover_image ? [row.cover_image] : [])));
}

/**
 * An Opinion article by Rafi (id 2) that has been public before, dated in 2000 so it sorts
 * after every sample article and does not move the front page, even once approved.
 * `pending` makes it a changed published article waiting for review. Returns its id and slug.
 */
export async function insertArticle(
  title: string,
  status: "published" | "pending" = "published",
): Promise<{ id: number; slug: string }> {
  if (!title.startsWith(`${E2E_TITLE} `)) throw new Error("E2E rows need an E2E title.");
  const slug = slugify(title);
  return withSql(async (sql) => {
    const [row] = await sql<{ id: number }[]>`
      insert into articles (title, slug, body, excerpt, status, author_id, category_id, created_at, submitted_at, published_at)
      values (${title}, ${slug}, '<p>Written by the end-to-end test.</p>', 'An article the end-to-end test wrote.',
              ${status}, 2, 4, '2000-06-01T00:00:00Z', '2000-06-01T00:00:00Z', '2000-06-01T00:00:00Z')
      returning id`;
    return { id: row.id, slug };
  });
}

/** The fields a review sets, read straight from the database. */
export async function reviewOf(
  id: number,
): Promise<{ status: string; review_note: string | null; reviewer_id: number | null; published_at: Date | null } | undefined> {
  return withSql(
    async (sql) =>
      (
        await sql<{ status: string; review_note: string | null; reviewer_id: number | null; published_at: Date | null }[]>`
          select status, review_note, reviewer_id, published_at from articles where id = ${id}`
      )[0],
  );
}

/** The status of one article, read straight from the database. */
export async function statusOf(id: number): Promise<string | undefined> {
  return withSql(async (sql) => (await sql<{ status: string }[]>`select status from articles where id = ${id}`)[0]?.status);
}

/** One article's view count, read straight from the database. */
export async function viewCountOf(id: number): Promise<number | undefined> {
  return withSql(async (sql) => (await sql<{ view_count: number }[]>`select view_count from articles where id = ${id}`)[0]?.view_count);
}

/** How many articles have a title starting with `prefix` (one test's own rows). */
export async function countTestArticles(prefix: string): Promise<number> {
  if (!prefix.startsWith(`${E2E_TITLE} `)) throw new Error("Only E2E rows are counted.");
  return withSql(async (sql) => (await sql<{ n: number }[]>`
    select count(*)::int as n from articles where starts_with(title, ${prefix})`)[0].n);
}

/**
 * Dates one test's article in 2000, as if it had been public before, so approving it keeps
 * that date (`coalesce(published_at, now())`) and it sorts after every sample article
 * instead of moving the front page for the tests running alongside.
 */
export async function backdateTestArticle(id: number): Promise<void> {
  await withSql((sql) => sql`
    update articles set published_at = '2000-06-01T00:00:00Z', created_at = '2000-06-01T00:00:00Z'
    where id = ${id} and starts_with(title, ${`${E2E_TITLE} `})`);
}

/**
 * E2E articles and accounts left behind, plus recorded uploads no article uses (anyone's,
 * since a test's own account may be gone), for a check by hand after a run.
 */
export async function leftovers(): Promise<{ articles: number; users: number; uploads: number }> {
  return withSql(async (sql) => {
    const [row] = await sql<{ articles: number; users: number; uploads: number }[]>`
      select
        (select count(*)::int from articles where starts_with(title, ${`${E2E_TITLE} `})) as articles,
        (select count(*)::int from users where email like 'e2e-%@herald.test') as users,
        (select count(*)::int from uploads u where not exists (select 1 from articles a where a.cover_image = u.path)) as uploads`;
    return row;
  });
}
