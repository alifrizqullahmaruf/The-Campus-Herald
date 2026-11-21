import { isCategorySlug } from "../categories";
import type { ArticleStatus } from "../types";

// Editor rules shared by the browser (an early hint) and the Server Actions (the real
// check), Phase 4 (docs/plans/2026-11-17-fase-4-alur-kerja.md, day 2). No server code here.

/** The column is VARCHAR(200). */
export const MAX_TITLE_LENGTH = 200;
/** The summary is the card excerpt and the lead above the article. */
export const MAX_SUMMARY_LENGTH = 300;
/** Measured before sanitising: far above any article (the longest sample is ~4,000). */
export const MAX_BODY_LENGTH = 100_000;
/** cover_alt is VARCHAR(255). */
export const MAX_COVER_ALT_LENGTH = 255;
/** An uploaded cover, after the editor made it smaller; under the 1 MB Server Action limit. */
export const MAX_COVER_BYTES = 950_000;
/** A cover address is a short path or URL; anything longer is not one of ours. */
const MAX_COVER_SRC_LENGTH = 500;
/** Slugs are VARCHAR(220); a number suffix ("-12") needs the rest. */
const MAX_SLUG_LENGTH = 200;

export interface EditorErrors {
  title?: string;
  summary?: string;
  category?: string;
  body?: string;
  cover?: string;
  coverAlt?: string;
}

export interface DraftFields {
  title: string;
  summary: string;
  categorySlug: string;
  body: string;
  coverImage?: string | null;
  coverAlt?: string;
}

/** What a draft needs before it can be saved: a topic, and nothing too long. */
export function validateDraft(fields: DraftFields): EditorErrors {
  const errors: EditorErrors = {};
  if (fields.title.trim().length > MAX_TITLE_LENGTH) errors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
  if (fields.summary.trim().length > MAX_SUMMARY_LENGTH) {
    errors.summary = `Keep the summary under ${MAX_SUMMARY_LENGTH} characters.`;
  }
  if (!isCategorySlug(fields.categorySlug)) errors.category = "Choose a category.";
  if (fields.body.length > MAX_BODY_LENGTH) errors.body = "The article is too long to save.";
  if ((fields.coverImage ?? "").length > MAX_COVER_SRC_LENGTH) errors.cover = "That cover cannot be used.";
  if ((fields.coverAlt ?? "").trim().length > MAX_COVER_ALT_LENGTH) {
    errors.coverAlt = `Keep the description under ${MAX_COVER_ALT_LENGTH} characters.`;
  }
  return errors;
}

/** Checks required before an article can go to the editor. Drafts may be incomplete. */
export function validateForSubmit(fields: {
  title: string;
  summary: string;
  categorySlug: string;
  bodyEmpty: boolean;
  coverImage?: string | null;
  coverAlt?: string;
}): EditorErrors {
  const errors: EditorErrors = {};
  if (!fields.title.trim()) errors.title = "Give the article a title.";
  if (!fields.summary.trim()) errors.summary = "Write a short summary.";
  if (!fields.categorySlug) errors.category = "Choose a category.";
  if (fields.bodyEmpty) errors.body = "Write the article before submitting it.";
  // Read aloud on the article page to people who cannot see the photo.
  if (fields.coverImage && !(fields.coverAlt ?? "").trim()) errors.coverAlt = "Describe the cover image.";
  return errors;
}

/**
 * Whether the author may still change the article: drafts, articles sent back, and published
 * ones (a change to those goes back to the editor). Not while it waits for review.
 */
export function isEditable(status: ArticleStatus): boolean {
  return status === "draft" || status === "rejected" || status === "published";
}

/** "Save draft" is for unpublished work only: a published article's change is submitted. */
export function canSaveDraft(status: ArticleStatus): boolean {
  return status === "draft" || status === "rejected";
}

/**
 * True when HTML holds nothing a reader would see: no text (spaces and &nbsp; do not
 * count) and no image. The server's check before submitting; the editor uses Tiptap's own.
 */
export function isBlankHtml(html: string): boolean {
  if (/<img\b/i.test(html)) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;|&#xa0;/gi, " ")
    .replace(/[\s\u00a0]+/g, "");
  return text.length === 0;
}

/** A draft may be saved without a title; lists and page titles still need a name for it. */
export function displayTitle(title: string): string {
  return title.trim() || "Untitled draft";
}

/**
 * The address part of an article URL: plain lower-case letters and digits joined by
 * hyphens ("Café opens" → "cafe-opens"), or "untitled" when nothing is left.
 */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}
