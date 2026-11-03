import "server-only";
import postgres from "postgres";

// The one PostgreSQL client (Phase 2, docs/plans/2026-11-02-fase-2-database.md).
// Only lib/data/* imports it: pages read data through lib/data. postgres.js opens
// connections lazily, on the first query.

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local, fill in the password, " +
      "then check the connection with `npm run db:check`.",
  );
}

// postgres.js parses the URL with `new URL` and decodeURIComponent. A TypeError
// from `new URL` carries the whole URL (its `input` property), password included,
// and could end up in the dev terminal or a build log. It is replaced by an error
// that has neither the URL nor a `cause`.
function connect(connectionUrl: string) {
  try {
    return postgres(connectionUrl);
  } catch {
    throw new Error(
      "DATABASE_URL is not a valid connection URL. URL-encode special characters in the password " +
        "(e.g. / as %2F, % as %25), then check it with `npm run db:check`.",
    );
  }
}

// `next dev` re-runs this module on every hot reload. Keeping the client on
// globalThis stops each reload from opening a new connection pool.
const globalForDb = globalThis as typeof globalThis & { sideNotesSql?: postgres.Sql };

export const sql = globalForDb.sideNotesSql ?? connect(url);

if (process.env.NODE_ENV !== "production") globalForDb.sideNotesSql = sql;
