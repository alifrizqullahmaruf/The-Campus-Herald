// Applies the files in db/migrations/ that have not run yet: `npm run db:migrate`
// (docs/plans/2026-11-02-fase-2-database.md). They run in name order, and the table
// schema_migrations records which have run. Each file runs in one transaction with
// its record, so a file that fails leaves nothing behind and is tried again next time.

import { readdirSync, readFileSync } from "node:fs";
import { withDatabase } from "./db-client.mjs";

const MIGRATIONS = new URL("../db/migrations/", import.meta.url);

await withDatabase(async (sql) => {
  await sql`
    create table if not exists schema_migrations (
      filename   text primary key,
      applied_at timestamptz not null default now()
    )`;

  const applied = new Set((await sql`select filename from schema_migrations`).map((row) => row.filename));
  const pending = readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith(".sql") && !applied.has(file))
    .sort();

  if (pending.length === 0) {
    console.log("No new migrations.");
    return;
  }

  for (const file of pending) {
    console.log(`Applying ${file}`);
    const statements = readFileSync(new URL(file, MIGRATIONS), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(statements);
      await tx`insert into schema_migrations (filename) values (${file})`;
    });
  }
  console.log(`Applied ${pending.length} migration(s).`);
});
