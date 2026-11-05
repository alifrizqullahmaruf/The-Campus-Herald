// Fills the database with the sample data from lib/mock: `npm run db:seed`
// (docs/plans/2026-11-02-fase-2-database.md). Run it after `npm run db:migrate`, which
// adds the topics. It REPLACES all users and articles, in one transaction, so it can
// be repeated and a failure leaves the old data as it was.

import type postgres from "postgres";
import { MOCK_ARTICLES } from "../lib/mock/articles";
import { MOCK_USERS } from "../lib/mock/users";
import { withDatabase } from "./db-client.mjs";

// Not a hash, so nobody can log in until Phase 3 sets real passwords. This holds only
// if the Phase 3 check treats an unknown format as a failed login.
const NO_LOGIN = "!no-login";

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

  await sql.begin(async (tx) => {
    // Fail rather than hang if another connection is holding these tables.
    await tx`set local lock_timeout = '5s'`;
    await tx`truncate articles, users restart identity cascade`;
    await tx`insert into users ${tx(users)}`;
    await tx`insert into articles ${tx(articles)}`;
    // The rows have fixed ids, so the next ids must continue after them.
    await tx`select setval(pg_get_serial_sequence('users', 'id'), (select max(id) from users))`;
    await tx`select setval(pg_get_serial_sequence('articles', 'id'), (select max(id) from articles))`;
  });
  console.log(`Seeded ${users.length} users and ${articles.length} articles.`);
});
