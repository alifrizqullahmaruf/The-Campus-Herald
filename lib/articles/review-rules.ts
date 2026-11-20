// Review rules shared by the review bar (an early hint) and the Server Actions (the real
// check), Phase 4 day 4 (docs/plans/2026-11-17-fase-4-alur-kerja.md). No server code here.

/** Long enough to explain what to change, short enough to read in the editor's note box. */
export const MIN_REVIEW_NOTE_LENGTH = 10;
export const MAX_REVIEW_NOTE_LENGTH = 2000;

/** A rejection must explain what to change (spec: "send it back with notes"). */
export function validateReviewNote(note: string): string | null {
  const length = note.trim().length;
  if (length < MIN_REVIEW_NOTE_LENGTH) return `Tell the author what to change (at least ${MIN_REVIEW_NOTE_LENGTH} characters).`;
  if (length > MAX_REVIEW_NOTE_LENGTH) return `Keep the note under ${MAX_REVIEW_NOTE_LENGTH} characters.`;
  return null;
}
