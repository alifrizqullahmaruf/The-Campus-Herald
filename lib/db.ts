import "server-only";
import postgres from "postgres";

// The one PostgreSQL client (Phase 2, docs/plans/2026-11-02-fase-2-database.md).
// Only lib/data/* imports it: pages read data through lib/data. postgres.js opens
// connections lazily, on the first query.

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Run `npm run db:setup` to create a local server, " +
      "or see .env.example to use another one.",
  );
}

// Keeps the password out of the dev terminal and build logs. postgres.js parses the
// URL with `new URL` and decodeURIComponent, and a TypeError from `new URL` carries
// the whole URL (its `input` property), so it is replaced by an error with neither
// the URL nor a `cause`. A second @ is an unencoded @ in the password: postgres.js
// would read part of the password as the host and name it in connection errors.
function connect(connectionUrl: string) {
  const invalid = new Error(
    "DATABASE_URL is not a valid connection URL. URL-encode special characters in the password " +
      "(e.g. @ as %40, / as %2F, % as %25), then check it with `npm run db:check`.",
  );
  if (connectionUrl.split("@").length > 2) throw invalid;
  try {
    // A build prerenders in several workers, each with its own pool, so each stays
    // small, and idle connections close so they cannot hold a process open.
    return postgres(connectionUrl, { max: 5, idle_timeout: 20 });
  } catch {
    throw invalid;
  }
}

// `next dev` re-runs this module on every hot reload. Keeping the client on
// globalThis stops each reload from opening a new connection pool.
const globalForDb = globalThis as typeof globalThis & { sideNotesSql?: postgres.Sql };

export const sql = globalForDb.sideNotesSql ?? connect(url);

if (process.env.NODE_ENV !== "production") globalForDb.sideNotesSql = sql;
