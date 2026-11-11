// Fills the database with the sample data from lib/mock: `npm run db:seed`
// (docs/plans/2026-11-02-fase-2-database.md). Run it after `npm run db:migrate`, which
// adds the topics. It REPLACES all users and articles, in one transaction, so it can
// be repeated and a failure leaves the old data as it was.

// On this computer every sample account gets the password in DEV_PASSWORD (.env.local),
// created at random on the first run and never printed. With --remote they get
// "!no-login" instead, which is not a hash and so never verifies (lib/auth/password.ts):
// the shared dev password must not reach a database other people can log in to.

import { randomBytes } from "node:crypto";
import type postgres from "postgres";
import { hashPassword } from "../lib/auth/password";
import { MOCK_ARTICLES } from "../lib/mock/articles";
import { MOCK_USERS } from "../lib/mock/users";
import { withDatabase } from "./db-client.mjs";
import { appendEnv } from "./env-file.mjs";

const NO_LOGIN = "!no-login";

/** DEV_PASSWORD from .env.local, created there first if it is missing. */
function devPassword(): string {
  const existing = process.env.DEV_PASSWORD;
  if (existing !== undefined) {
    if (existing.length < 8) throw new Error("DEV_PASSWORD in .env.local is shorter than 8 characters.");
    return existing;
  }
  const created = randomBytes(18).toString("base64url");
  appendEnv("DEV_PASSWORD", created);
  console.log("Created DEV_PASSWORD in .env.local: the password of every sample account.");
  return created;
}

const users = MOCK_USERS.map((user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  password_hash: NO_LOGIN,
  role: user.role,
  is_active: user.isActive,
  bio: user.bio,
  beat: user.beat,
}));

const articles = MOCK_ARTICLES.map((article) => ({
  id: article.id,
  title: article.title,
  slug: article.slug,
  body: article.body,
  excerpt: article.excerpt,
  cover_image: article.coverImage,
  cover_credit_name: article.coverCredit?.name ?? null,
  cover_credit_profile_url: article.coverCredit?.profileUrl ?? null,
  cover_credit_photo_url: article.coverCredit?.photoUrl ?? null,
  cover_credit_source: article.coverCredit?.source ?? null,
  status: article.status,
  review_note: article.reviewNote,
  view_count: article.viewCount,
  author_id: article.authorId,
  reviewer_id: article.reviewerId,
  category_id: article.categoryId,
  created_at: article.createdAt,
  submitted_at: article.submittedAt,
  published_at: article.publishedAt,
}));

// No top-level await: tsx runs .ts files in this package as CommonJS. withDatabase
// reports its own errors, so the promise needs no handling here.
void withDatabase(async (sql: postgres.Sql) => {
  // This deletes data, so a database elsewhere (Neon) takes an explicit flag.
  const local = sql.options.host.every((host) => ["localhost", "127.0.0.1"].includes(host));
  if (!local && !process.argv.includes("--remote")) {
    console.error("DATABASE_URL is not on this computer, and seeding replaces all users and articles. Nothing was changed.");
    console.error("If that is what you want: npm run db:seed -- --remote");
    process.exitCode = 1;
    return;
  }

  // localhost can still be the wrong database (the Windows service, or a tunnel), so
  // only a database migrated by this project is emptied. A missing table is an error
  // with its own hint in db-client.mjs.
  const migrated = await sql`select 1 from schema_migrations where filename = '002_categories.sql'`;
  if (migrated.length === 0) {
    console.error("This database does not have the topics yet. Nothing was changed. Run npm run db:migrate first.");
    process.exitCode = 1;
    return;
  }
  console.log(`Seeding ${sql.options.host[0]}:${sql.options.port[0]}/${sql.options.database}`);

  // --remote never gets the dev password, even through a tunnel that looks local.
  let password: string | null = null;
  if (local && !process.argv.includes("--remote")) {
    try {
      password = devPassword();
    } catch (error) {
      console.error(`${(error as Error).message} Nothing was changed.`);
      process.exitCode = 1;
      return;
    }
  }
  // Each account gets its own salt, so equal passwords still give different hashes.
  const hashes = await Promise.all(users.map(() => (password === null ? NO_LOGIN : hashPassword(password))));
  const rows = users.map((user, i) => ({ ...user, password_hash: hashes[i] }));

  await sql.begin(async (tx) => {
    // Fail rather than hang if another connection is holding these tables.
    await tx`set local lock_timeout = '5s'`;
    await tx`truncate articles, users restart identity cascade`;
    await tx`insert into users ${tx(rows)}`;
    await tx`insert into articles ${tx(articles)}`;
    // The rows have fixed ids, so the next ids must continue after them.
    await tx`select setval(pg_get_serial_sequence('users', 'id'), (select max(id) from users))`;
    await tx`select setval(pg_get_serial_sequence('articles', 'id'), (select max(id) from articles))`;
  });
  console.log(`Seeded ${users.length} users and ${articles.length} articles; sample accounts ${password === null ? "cannot log in" : "use DEV_PASSWORD"}.`);
});
