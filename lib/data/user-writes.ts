import "server-only";
import { sql } from "../db";

// Writes to the users table (Phase 4 day 5, docs/plans/2026-11-17-fase-4-alur-kerja.md). Only
// the Server Actions in lib/auth/author-actions.ts call these, after checking the
// administrator. Never cached; the caller expires the "users" cache tag afterwards. Every
// change is limited to accounts with role 'author': the administrator's own account is not
// managed here.

const UNIQUE_VIOLATION = "23505";

/** A new author account. Returns its id, or "taken" when the email is already used. */
export async function insertAuthor(fields: { name: string; email: string; passwordHash: string }): Promise<number | "taken"> {
  try {
    const [row] = await sql<{ id: number }[]>`
      insert into users (name, email, password_hash, role)
      values (${fields.name}, ${fields.email}, ${fields.passwordHash}, 'author')
      returning id`;
    return row.id;
  } catch (error) {
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) return "taken";
    throw error;
  }
}

/** Allows or stops an author's logins; the name, if the account is an author's. */
export async function setActive(id: number, active: boolean): Promise<string | null> {
  const [row] = await sql<{ name: string }[]>`
    update users set is_active = ${active} where id = ${id} and role = 'author' returning name`;
  return row?.name ?? null;
}

/**
 * Replaces an author's password hash; the name, if the account is an author's. The session
 * cookie carries a stamp of the hash, so every earlier login of the account ends here.
 */
export async function setPasswordHash(id: number, passwordHash: string): Promise<string | null> {
  const [row] = await sql<{ name: string }[]>`
    update users set password_hash = ${passwordHash} where id = ${id} and role = 'author' returning name`;
  return row?.name ?? null;
}
