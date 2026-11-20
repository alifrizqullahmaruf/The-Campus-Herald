"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "../auth/current-user";
import { reviewArticle, type ReviewDecision } from "../data/article-writes";
import { isValidId } from "../data/ids";
import { validateReviewNote } from "./review-rules";

// The administrator's review (Phase 4 day 4, docs/plans/2026-11-17-fase-4-alur-kerja.md).
// Each action checks the role itself: anything from the browser is untrusted.

export type ReviewResult =
  | { ok: true; status: "published" | "rejected" }
  | { ok: false; error: "note" | "gone" | "failed"; message: string };

const GONE = "This article is no longer waiting for review. Reload the page to see where it is.";
const FAILED = "Could not save the decision. Try again.";

async function decide(id: unknown, decision: ReviewDecision): Promise<ReviewResult> {
  const reviewer = await requireAdmin();
  if (typeof id !== "number" || !isValidId(id)) return { ok: false, error: "gone", message: GONE };
  let done: number | null;
  try {
    done = await reviewArticle(reviewer.id, id, decision);
  } catch (error) {
    console.error("review failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed", message: FAILED };
  }
  if (done === null) return { ok: false, error: "gone", message: GONE };
  // The public pages too: an approved article appears on the site at once.
  updateTag("articles");
  return { ok: true, status: decision.approve ? "published" : "rejected" };
}

/** Publishes an article waiting for review. Administrators only. */
export async function approveArticle(id: number): Promise<ReviewResult> {
  return decide(id, { approve: true });
}

/** Sends an article waiting for review back to its author with a note. Administrators only. */
export async function rejectArticle(id: number, note: string): Promise<ReviewResult> {
  // The role first: a visitor learns nothing, not even whether the note would pass.
  await requireAdmin();
  const text = typeof note === "string" ? note.trim() : "";
  const problem = validateReviewNote(text);
  if (problem) return { ok: false, error: "note", message: problem };
  return decide(id, { approve: false, note: text });
}
