"use server";

import { updateTag } from "next/cache";
import { requireUser } from "../auth/current-user";
import { createDraft, submitArticle, updateDraft, type DraftWrite } from "../data/article-writes";
import { isValidId } from "../data/ids";
import { sanitizeArticleHtml } from "../sanitize-html";
import { isBlankHtml, validateDraft, validateForSubmit, type EditorErrors } from "./draft-rules";

// Saving and submitting articles (Phase 4, docs/plans/2026-11-17-fase-4-alur-kerja.md). Each
// action checks the user itself: anything from the browser is untrusted, whatever the
// editor allowed.

export interface ArticleInput {
  id: number | null;
  title: string;
  summary: string;
  categorySlug: string;
  body: string;
  /** An uploaded cover ("/uploads/…"), the cover the article already has, or null for none. */
  coverImage: string | null;
  coverAlt: string;
}

type Failure = { ok: false; errors: EditorErrors; message: string };
export type SaveDraftResult = { ok: true; id: number; savedAt: string } | Failure;
export type SubmitResult = { ok: true; id: number; status: "pending" } | Failure;

const NOT_SAVED = "Could not save. Try again.";
const GONE = "This article cannot be saved here any more. Reload the page to see why.";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * The editor's fields, checked for type and length, with the body sanitised; or the failure
 * to send back. `id` is null for a new article.
 */
function readArticleInput(input: unknown): { id: number | null; fields: DraftWrite } | Failure {
  const raw = input as Record<string, unknown> | null;
  const title = asString(raw?.title);
  const summary = asString(raw?.summary);
  const categorySlug = asString(raw?.categorySlug);
  const body = asString(raw?.body);
  const coverAlt = asString(raw?.coverAlt);
  const coverImage = raw?.coverImage ?? null;
  const id = raw?.id ?? null;
  if (title === null || summary === null || categorySlug === null || body === null || coverAlt === null) {
    return { ok: false, errors: {}, message: NOT_SAVED };
  }
  if (coverImage !== null && typeof coverImage !== "string") return { ok: false, errors: {}, message: NOT_SAVED };
  if (id !== null && !(typeof id === "number" && isValidId(id))) return { ok: false, errors: {}, message: GONE };
  const errors = validateDraft({ title, summary, categorySlug, body, coverImage, coverAlt });
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Fix the highlighted fields, then try again." };
  }
  // A cover that is neither an upload nor the article's own stored one is dropped by the
  // write (lib/data/article-writes.ts), which can see what is stored.
  return {
    id,
    fields: {
      title: title.trim(),
      summary: summary.trim(),
      categorySlug,
      body: sanitizeArticleHtml(body),
      coverImage: coverImage || null,
      coverAlt: coverAlt.trim(),
    },
  };
}

/** Runs a write, keeping database errors on the server. */
async function write(name: string, run: () => Promise<number | null>): Promise<number | null | Failure> {
  try {
    return await run();
  } catch (error) {
    console.error(`${name} failed`, error instanceof Error ? error.message : error);
    return { ok: false, errors: {}, message: NOT_SAVED };
  }
}

/**
 * Saves a draft: a new one when `id` is null, else the author's own draft or article sent
 * back. The status does not change. The body is sanitised before it is stored.
 */
export async function saveDraft(input: ArticleInput): Promise<SaveDraftResult> {
  const user = await requireUser();
  const read = readArticleInput(input);
  if ("ok" in read) return read;
  const { id, fields } = read;

  const saved = await write("saveDraft", () => (id === null ? createDraft(user.id, fields) : updateDraft(user.id, id, fields)));
  if (saved === null) return { ok: false, errors: {}, message: GONE };
  if (typeof saved !== "number") return saved;

  updateTag("articles");
  return { ok: true, id: saved, savedAt: new Date().toISOString() };
}

/**
 * Sends an article to the editor for review, saving it too: a new one, or the author's own
 * draft, article sent back or published article (which leaves the site until approved
 * again). Everything a reader would need must be there; the check runs on the sanitised body.
 */
export async function submitForReview(input: ArticleInput): Promise<SubmitResult> {
  const user = await requireUser();
  const read = readArticleInput(input);
  if ("ok" in read) return read;
  const { id, fields } = read;

  const errors = validateForSubmit({ ...fields, bodyEmpty: isBlankHtml(fields.body) });
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Fix the highlighted fields, then submit again." };
  }

  const sent = await write("submitForReview", () => submitArticle(user.id, id, fields));
  if (sent === null) return { ok: false, errors: {}, message: GONE };
  if (typeof sent !== "number") return sent;

  // Also the public pages: a published article that was changed is off the site now.
  updateTag("articles");
  return { ok: true, id: sent, status: "pending" };
}
