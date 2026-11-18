"use server";

import { updateTag } from "next/cache";
import { requireUser } from "../auth/current-user";
import { createDraft, updateDraft } from "../data/article-writes";
import { isValidId } from "../data/ids";
import { sanitizeArticleHtml } from "../sanitize-html";
import { validateDraft, type EditorErrors } from "./draft-rules";

// Saving articles (Phase 4, docs/plans/2026-11-17-fase-4-alur-kerja.md). Each action checks
// the user itself: anything from the browser is untrusted, whatever the editor allowed.

export type SaveDraftResult =
  | { ok: true; id: number; savedAt: string }
  | { ok: false; errors: EditorErrors; message: string };

const NOT_SAVED = "Could not save. Try again.";
const GONE = "This article cannot be saved here any more. Reload the page to see why.";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Saves a draft: a new one when `id` is null, else the author's own draft or article sent
 * back. The status does not change. The body is sanitised before it is stored.
 */
export async function saveDraft(input: {
  id: number | null;
  title: string;
  summary: string;
  categorySlug: string;
  body: string;
}): Promise<SaveDraftResult> {
  const user = await requireUser();

  const raw = input as Record<string, unknown> | null;
  const title = asString(raw?.title);
  const summary = asString(raw?.summary);
  const categorySlug = asString(raw?.categorySlug);
  const body = asString(raw?.body);
  const id = raw?.id ?? null;
  if (title === null || summary === null || categorySlug === null || body === null) {
    return { ok: false, errors: {}, message: NOT_SAVED };
  }
  if (id !== null && !(typeof id === "number" && isValidId(id))) return { ok: false, errors: {}, message: GONE };

  const errors = validateDraft({ title, summary, categorySlug, body });
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Fix the highlighted fields, then save again." };
  }

  const fields = { title: title.trim(), summary: summary.trim(), categorySlug, body: sanitizeArticleHtml(body) };
  let savedId: number | null;
  try {
    savedId = id === null ? await createDraft(user.id, fields) : await updateDraft(user.id, id, fields);
  } catch (error) {
    console.error("saveDraft failed", error instanceof Error ? error.message : error);
    return { ok: false, errors: {}, message: NOT_SAVED };
  }
  if (savedId === null) return { ok: false, errors: {}, message: GONE };

  updateTag("articles");
  return { ok: true, id: savedId, savedAt: new Date().toISOString() };
}
