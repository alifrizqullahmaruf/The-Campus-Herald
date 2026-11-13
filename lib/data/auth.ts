import "server-only";

// Account lookups for the login check (Phase 3, docs/plans/2026-11-10-fase-3-login.md).
// Deliberately NOT cached: role, active status and password must be read fresh on every
// request, so a deactivated account or a changed password takes effect at once. Never
// add "use cache" here, and never pass passwordHash to a page or a cached function.

import { sql } from "../db";
import { isValidId } from "./ids";
import type { Role, User } from "../types";

export interface AccountRecord {
  user: User;
  passwordHash: string;
}

type AccountRow = Omit<User, "isActive" | "role"> & { role: Role; is_active: boolean; password_hash: string };

/** The account with this id and its password hash, read now from the database, or null. */
export async function getAccountById(id: number): Promise<AccountRecord | null> {
  if (!isValidId(id)) return null;
  const [row] = await sql<AccountRow[]>`
    select id, name, email, role, is_active, bio, beat, password_hash from users where id = ${id}`;
  if (!row) return null;
  const { is_active, password_hash, ...user } = row;
  return { user: { ...user, isActive: is_active }, passwordHash: password_hash };
}

/**
 * The account with this email, ignoring case, or null. Emails are unique only as typed
 * (db/migrations/001), so "Rafi@x" and "rafi@x" could both exist: then neither logs in,
 * the same rule as `npm run db:set-password`.
 */
export async function getAccountByEmail(email: string): Promise<AccountRecord | null> {
  const rows = await sql<AccountRow[]>`
    select id, name, email, role, is_active, bio, beat, password_hash from users
    where lower(email) = lower(${email}) limit 2`;
  if (rows.length !== 1) return null;
  const { is_active, password_hash, ...user } = rows[0];
  return { user: { ...user, isActive: is_active }, passwordHash: password_hash };
}
