// The sample-data version of lib/data/session.ts, for unit tests only (__tests__/setup.ts).

import { PREVIEW_ADMIN_ID, PREVIEW_AUTHOR_ID } from "./session";
import { MOCK_USERS } from "./users";
import type { User } from "../types";

/** The preview account for author pages (Rafi) or admin pages (Dewi). */
export async function getPreviewUser(role: "author" | "admin"): Promise<User> {
  const id = role === "admin" ? PREVIEW_ADMIN_ID : PREVIEW_AUTHOR_ID;
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) throw new Error(`Unknown preview ${role} id: ${id}`);
  return user;
}
