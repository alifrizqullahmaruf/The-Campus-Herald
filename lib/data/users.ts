// Data access for users. Public pages get AuthorSummary only (no email, no role).
// Columns are always named, never `select *`: password_hash must stay out of cached
// results. Results are cached until Phase 4 invalidates them with updateTag.

import { cacheLife, cacheTag } from "next/cache";
import { getCategoryById } from "../categories";
import { sql } from "../db";
import type { AuthorSummary, CategorySlug, Role, User } from "../types";
import { isValidId } from "./ids";

export interface AuthorProfile extends AuthorSummary {
  isActive: boolean;
  /** Number of published articles. */
  articleCount: number;
  /** The category they publish in most, used for their card colour. */
  primaryCategory: CategorySlug | null;
}

interface ProfileRow {
  id: number;
  name: string;
  bio: string;
  beat: string;
  is_active: boolean;
  article_count: number;
  top_category_id: number | null;
}

// Published articles only; a tie for the main category goes to the lowest category id.
const profileColumns = sql`
  u.id, u.name, u.bio, u.beat, u.is_active,
  (select count(*)::int from articles a
    where a.author_id = u.id and a.status = 'published') as article_count,
  (select a.category_id from articles a
    where a.author_id = u.id and a.status = 'published'
    group by a.category_id
    order by count(*) desc, a.category_id
    limit 1) as top_category_id`;

function toProfile(row: ProfileRow): AuthorProfile {
  return {
    id: row.id,
    name: row.name,
    bio: row.bio,
    beat: row.beat,
    isActive: row.is_active,
    articleCount: row.article_count,
    primaryCategory: row.top_category_id === null ? null : getCategoryById(row.top_category_id).slug,
  };
}

/** Active authors for the public Authors page, alphabetical. */
export async function getAuthors(): Promise<AuthorSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag("users");
  const rows = await sql<AuthorSummary[]>`
    select id, name, bio, beat from users where role = 'author' and is_active order by id`;
  return rows.map((row) => ({ ...row })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Active authors with their article count and main category, alphabetical. */
export async function getAuthorProfiles(): Promise<AuthorProfile[]> {
  "use cache";
  cacheLife("max");
  cacheTag("users", "articles");
  const rows = await sql<ProfileRow[]>`
    select ${profileColumns} from users u where u.role = 'author' and u.is_active order by u.id`;
  return rows.map(toProfile).sort((a, b) => a.name.localeCompare(b.name));
}

/** One author for the public author page. Inactive authors stay visible so old articles keep a byline. */
export async function getAuthorById(id: number): Promise<AuthorSummary | null> {
  "use cache";
  cacheLife("max");
  cacheTag("users");
  if (!isValidId(id)) return null;
  const [row] = await sql<AuthorSummary[]>`
    select id, name, bio, beat from users where id = ${id} and role = 'author'`;
  return row ? { ...row } : null;
}

/** Profile for /authors/[id], including former (inactive) members. */
export async function getAuthorProfile(id: number): Promise<AuthorProfile | null> {
  "use cache";
  cacheLife("max");
  cacheTag("users", "articles");
  if (!isValidId(id)) return null;
  const [row] = await sql<ProfileRow[]>`
    select ${profileColumns} from users u where u.id = ${id} and u.role = 'author'`;
  return row ? toProfile(row) : null;
}

/** Ids of every author account, for prerendering author pages. */
export async function getAllAuthorIds(): Promise<number[]> {
  "use cache";
  cacheLife("max");
  cacheTag("users");
  const rows = await sql<{ id: number }[]>`select id from users where role = 'author' order by id`;
  return rows.map((row) => row.id);
}

/** Every account including inactive ones, for the admin's author management page. */
export async function getAllUsers(): Promise<User[]> {
  "use cache";
  cacheLife("max");
  cacheTag("users");
  const rows = await sql<(Omit<User, "isActive" | "role"> & { role: Role; is_active: boolean })[]>`
    select id, name, email, role, is_active, bio, beat from users order by id`;
  return rows.map(({ is_active, ...row }) => ({ ...row, isActive: is_active }));
}
