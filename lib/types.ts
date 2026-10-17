// Domain types. Field names follow the database schema in
// docs/the-campus-herald.md (stage 06), converted to camelCase.

export type Role = "author" | "admin";

export type ArticleStatus = "draft" | "pending" | "published" | "rejected";

export type CategorySlug =
  | "academics"
  | "organisations"
  | "events"
  | "opinion"
  | "achievements";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  /** Short public bio for the author card and author page. Not in the stage 06 schema yet. */
  bio: string;
  /** Beat shown on the author card, e.g. "Opinion writer". Not in the stage 06 schema yet. */
  beat: string;
}

/** Photographer credit shown next to a stock photo. */
export interface CoverCredit {
  name: string;
  /** Photographer profile on the photo source. */
  profileUrl: string;
  /** The photo page on the source. */
  photoUrl: string;
  source: "Unsplash";
}

export interface Category {
  id: number;
  name: string;
  slug: CategorySlug;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  /** Sanitised HTML from the editor. */
  body: string;
  /** One- or two-sentence summary for cards. Derived from the body once a database exists. */
  excerpt: string;
  coverImage: string | null;
  /** Credit for a stock cover photo (Unsplash requires it); null for author uploads. Not in the stage 06 schema yet. */
  coverCredit: CoverCredit | null;
  status: ArticleStatus;
  reviewNote: string | null;
  viewCount: number;
  authorId: number;
  reviewerId: number | null;
  categoryId: number;
  /** ISO 8601 timestamps. */
  createdAt: string;
  submittedAt: string | null;
  publishedAt: string | null;
}

/** Public-facing view of a user; never includes email or role. */
export type AuthorSummary = Pick<User, "id" | "name" | "bio" | "beat">;

/** Article joined with its category and author, as pages consume it. */
export interface ArticleWithRelations extends Article {
  category: Category;
  author: AuthorSummary;
  /** Estimated minutes to read the body. */
  readingMinutes: number;
}
