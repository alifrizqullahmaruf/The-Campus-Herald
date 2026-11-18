import postgres from "postgres";

// Direct database access for tests that write: they remove their own rows afterwards, so
// the sample data stays as `npm run db:seed` made it. DATABASE_URL comes from .env.local,
// which playwright.config.ts loads; its value is never printed.

/** The title prefix every row an E2E test creates starts with. */
export const E2E_TITLE = "E2E draft";

/** A title no other test uses, so each test removes only its own rows (tests run in parallel). */
export function uniqueTitle(): string {
  return `${E2E_TITLE} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Deletes the articles whose title starts with `prefix` (one test's own rows). */
export async function deleteTestArticles(prefix: string): Promise<void> {
  if (!prefix.startsWith(`${E2E_TITLE} `)) throw new Error("Only E2E rows may be deleted.");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set: run `npm run db:setup`.");
  const sql = postgres(url, { max: 1 });
  try {
    await sql`delete from articles where starts_with(title, ${prefix})`;
  } finally {
    await sql.end();
  }
}
