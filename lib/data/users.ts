// Data access for users. Public pages get AuthorSummary only (no email, no role).

import { getCategoryById } from "../categories";
import { MOCK_ARTICLES } from "../mock/articles";
import { MOCK_USERS } from "../mock/users";
import type { AuthorSummary, CategorySlug, User } from "../types";

function toSummary(user: User): AuthorSummary {
  return { id: user.id, name: user.name, bio: user.bio, beat: user.beat };
}

export interface AuthorProfile extends AuthorSummary {
  isActive: boolean;
  /** Number of published articles. */
  articleCount: number;
  /** The category they publish in most, used for their card colour. */
  primaryCategory: CategorySlug | null;
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

/** Active authors for the public Authors page, alphabetical. */
export async function getAuthors(): Promise<AuthorSummary[]> {
  return MOCK_USERS.filter((user) => user.role === "author" && user.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toSummary);
}

/** Active authors with their article count and main category, alphabetical. */
export async function getAuthorProfiles(): Promise<AuthorProfile[]> {
  return MOCK_USERS.filter((user) => user.role === "author" && user.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toProfile);
}

/** One author for the public author page. Inactive authors stay visible so old articles keep a byline. */
export async function getAuthorById(id: number): Promise<AuthorSummary | null> {
  const user = MOCK_USERS.find((u) => u.id === id && u.role === "author");
  return user ? toSummary(user) : null;
}

/** Profile for /authors/[id], including former (inactive) members. */
export async function getAuthorProfile(id: number): Promise<AuthorProfile | null> {
  const user = MOCK_USERS.find((u) => u.id === id && u.role === "author");
  return user ? toProfile(user) : null;
}

/** Ids of every author account, for prerendering author pages. */
export async function getAllAuthorIds(): Promise<number[]> {
  return MOCK_USERS.filter((user) => user.role === "author").map((user) => user.id);
}

/** Every account including inactive ones, for the admin's author management page. */
export async function getAllUsers(): Promise<User[]> {
  return [...MOCK_USERS];
}
