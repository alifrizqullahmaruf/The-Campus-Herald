// Checks the database connection in .env.local: `npm run db:check`
// (docs/plans/2026-11-02-fase-2-database.md). Prints the PostgreSQL version, the
// database and the user; on failure, a hint about what to fix. Never prints
// DATABASE_URL itself, since it holds the password.

import { withDatabase } from "./db-client.mjs";

await withDatabase(async (sql) => {
  const [row] = await sql`
    select current_setting('server_version') as version,
           current_database() as database,
           current_user as username`;
  console.log(`Connected: PostgreSQL ${row.version}, database "${row.database}", user "${row.username}".`);
});
