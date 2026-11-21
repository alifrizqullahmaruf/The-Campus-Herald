import "server-only";
import { sql } from "../db";
import { deleteUpload } from "../uploads/storage";

// The uploads table (migration 004, Phase 4 day 6): who uploaded which cover file. Only
// lib/articles/cover-actions.ts and lib/data/article-writes.ts use it. Never cached.

/** How many covers one account may upload in an hour. */
export const UPLOADS_PER_HOUR = 30;

/** Records an upload as this user's. */
export async function recordUpload(ownerId: number, path: string): Promise<void> {
  await sql`insert into uploads (path, owner_id) values (${path}, ${ownerId})`;
}

/** The number of covers this user uploaded in the last hour. */
export async function uploadsInLastHour(ownerId: number): Promise<number> {
  const [row] = await sql<{ count: number }[]>`
    select count(*)::int as count from uploads where owner_id = ${ownerId} and created_at > now() - interval '1 hour'`;
  return row.count;
}

/**
 * Deletes this user's uploads that no article points to and that are older than a day
 * (chosen but never saved, or replaced before saving); a failure only leaves a file.
 */
export async function removeAbandonedUploads(ownerId: number): Promise<void> {
  const rows = await sql<{ path: string }[]>`
    delete from uploads u
    where u.owner_id = ${ownerId} and u.created_at < now() - interval '1 day'
      and not exists (select 1 from articles a where a.cover_image = u.path)
    returning u.path`;
  for (const { path } of rows) {
    await deleteUpload(path).catch((error) => console.error("deleting an abandoned cover failed", error instanceof Error ? error.message : error));
  }
}
