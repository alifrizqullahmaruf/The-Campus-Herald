import "server-only";
import { sql } from "../db";
import { isValidId } from "./ids";

// Counting a read (Phase 4 day 7, docs/plans/2026-11-17-fase-4-alur-kerja.md). Used only by
// app/api/views/[id]/route.ts, which allows one count per browser per article a day. Never
// cached, and it does not expire the "articles" tag: every visit would empty the whole
// cache. getMostRead in lib/data/articles.ts picks the new numbers up within an hour.

/** Adds one view to a published article. False when there is no such article. */
export async function countView(id: number): Promise<boolean> {
  if (!isValidId(id)) return false;
  const rows = await sql`
    update articles set view_count = view_count + 1
    where id = ${id} and status = 'published' returning id`;
  return rows.length === 1;
}
