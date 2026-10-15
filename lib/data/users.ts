// Data access for users. Public pages get AuthorSummary only (no email, no role).

import { MOCK_USERS } from "../mock/users";
import type { AuthorSummary, User } from "../types";

function toSummary(user: User): AuthorSummary {
  return { id: user.id, name: user.name, bio: user.bio, beat: user.beat };
}

/** Active authors for the public Authors page, alphabetical. */
export async function getAuthors(): Promise<AuthorSummary[]> {
  return MOCK_USERS.filter((user) => user.role === "author" && user.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toSummary);
}

/** One author for the public author page. Inactive authors stay visible so old articles keep a byline. */
export async function getAuthorById(id: number): Promise<AuthorSummary | null> {
  const user = MOCK_USERS.find((u) => u.id === id && u.role === "author");
  return user ? toSummary(user) : null;
}

/** Every account including inactive ones, for the admin's author management page. */
export async function getAllUsers(): Promise<User[]> {
  return [...MOCK_USERS];
}
