// The sample-data version of lib/data/users.ts, for unit tests only: __tests__/setup.ts
// puts it in place of the real module, so Vitest never loads lib/db.ts.

import { getCategoryById } from "../categories";
import type { AuthorProfile } from "../data/users";
import type { AuthorSummary, User } from "../types";
import { MOCK_ARTICLES } from "./articles";
import { MOCK_USERS } from "./users";

function toSummary(user: User): AuthorSummary {
  return { id: user.id, name: user.name, bio: user.bio, beat: user.beat };
}

function toProfile(user: User): AuthorProfile {
  const published = MOCK_ARTICLES.filter((a) => a.authorId === user.id && a.status === "published");
  const tally = new Map<number, number>();
  for (const article of published) tally.set(article.categoryId, (tally.get(article.categoryId) ?? 0) + 1);
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  return {
    ...toSummary(user),
    isActive: user.isActive,
    articleCount: published.length,
    primaryCategory: top ? getCategoryById(top[0]).slug : null,
  };
}

export async function getAuthors(): Promise<AuthorSummary[]> {
  return MOCK_USERS.filter((user) => user.role === "author" && user.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toSummary);
}

export async function getAuthorProfiles(): Promise<AuthorProfile[]> {
  return MOCK_USERS.filter((user) => user.role === "author" && user.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toProfile);
}

export async function getAuthorById(id: number): Promise<AuthorSummary | null> {
  const user = MOCK_USERS.find((u) => u.id === id && u.role === "author");
  return user ? toSummary(user) : null;
}

export async function getAuthorProfile(id: number): Promise<AuthorProfile | null> {
  const user = MOCK_USERS.find((u) => u.id === id && u.role === "author");
  return user ? toProfile(user) : null;
}

export async function getAllAuthorIds(): Promise<number[]> {
  return MOCK_USERS.filter((user) => user.role === "author").map((user) => user.id);
}

export async function getAllUsers(): Promise<User[]> {
  return [...MOCK_USERS];
}
