import { isCategorySlug } from "../categories";

// Editor rules shared by the browser (an early hint) and the Server Actions (the real
// check), Phase 4 (docs/plans/2026-11-17-fase-4-alur-kerja.md, day 2). No server code here.

/** The column is VARCHAR(200). */
export const MAX_TITLE_LENGTH = 200;
/** The summary is the card excerpt and the lead above the article. */
export const MAX_SUMMARY_LENGTH = 300;
/** Measured before sanitising: far above any article (the longest sample is ~4,000). */
export const MAX_BODY_LENGTH = 100_000;
/** Slugs are VARCHAR(220); a number suffix ("-12") needs the rest. */
const MAX_SLUG_LENGTH = 200;

export interface EditorErrors {
  title?: string;
  summary?: string;
  category?: string;
  body?: string;
}

export interface DraftFields {
  title: string;
  summary: string;
  categorySlug: string;
  body: string;
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
  return errors;
}

/** Checks required before an article can go to the editor. Drafts may be incomplete. */
export function validateForSubmit(fields: {
  title: string;
  summary: string;
  categorySlug: string;
  bodyEmpty: boolean;
}): EditorErrors {
  const errors: EditorErrors = {};
  if (!fields.title.trim()) errors.title = "Give the article a title.";
  if (!fields.summary.trim()) errors.summary = "Write a short summary.";
  if (!fields.categorySlug) errors.category = "Choose a category.";
  if (fields.bodyEmpty) errors.body = "Write the article before submitting it.";
  return errors;
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
