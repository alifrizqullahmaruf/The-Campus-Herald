// Who the dashboard shows as signed in. Phase 1 has no login, so pages ask for a
// preview account by role; Phase 3 replaces this with the real session.

import { PREVIEW_ADMIN_ID, PREVIEW_AUTHOR_ID } from "../mock/session";
import { MOCK_USERS } from "../mock/users";
import type { User } from "../types";

/** The preview account for author pages (Rafi) or admin pages (Dewi). */
export async function getPreviewUser(role: "author" | "admin"): Promise<User> {
  const id = role === "admin" ? PREVIEW_ADMIN_ID : PREVIEW_AUTHOR_ID;
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) throw new Error(`Unknown preview ${role} id: ${id}`);
  return user;
}
