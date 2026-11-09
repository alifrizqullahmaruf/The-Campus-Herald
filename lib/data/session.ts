// Who the dashboard shows as signed in. There is no login yet, so pages ask for a
// preview account by role; Phase 3 replaces this with the real session.

import { cacheLife, cacheTag } from "next/cache";
import { sql } from "../db";
import type { Role, User } from "../types";

// Rafi for author pages, Dewi for admin (editor) pages. The unit tests use the same ids
// from lib/mock/session.ts; change both together.
const PREVIEW_IDS = { author: 2, admin: 1 } as const;

/** The preview account for author pages (Rafi) or admin pages (Dewi). */
export async function getPreviewUser(role: "author" | "admin"): Promise<User> {
  "use cache";
  cacheLife("max");
  cacheTag("users");
  const id = PREVIEW_IDS[role];
  const [row] = await sql<(Omit<User, "isActive" | "role"> & { role: Role; is_active: boolean })[]>`
    select id, name, email, role, is_active, bio, beat from users where id = ${id}`;
  if (!row) throw new Error(`Unknown preview ${role} id: ${id}`);
  const { is_active, ...user } = row;
  return { ...user, isActive: is_active };
}
