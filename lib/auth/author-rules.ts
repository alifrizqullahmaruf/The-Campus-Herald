// Rules for author accounts, shared by the author manager (an early hint) and the Server
// Actions (the real check), Phase 4 day 5 (docs/plans/2026-11-17-fase-4-alur-kerja.md).
// No server code here.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** users.name is VARCHAR(100), users.email VARCHAR(150). */
export const MAX_NAME_LENGTH = 100;
export const MAX_ACCOUNT_EMAIL_LENGTH = 150;

export interface NewAuthorErrors {
  name?: string;
  email?: string;
}

/** Emails are stored trimmed and in lower case, so the same address is always one account. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Rules for a new author account. `existingEmails` is the list on screen, a hint only: the
 * database refuses a second account for the same address (migration 003).
 */
export function validateNewAuthor(fields: { name: string; email: string }, existingEmails: string[] = []): NewAuthorErrors {
  const errors: NewAuthorErrors = {};
  const name = fields.name.trim();
  const email = normalizeEmail(fields.email);
  if (!name) errors.name = "Enter the author's name.";
  else if (name.length > MAX_NAME_LENGTH) errors.name = `Keep the name under ${MAX_NAME_LENGTH} characters.`;
  if (!EMAIL.test(email) || email.length > MAX_ACCOUNT_EMAIL_LENGTH) errors.email = "Enter a valid email address.";
  else if (existingEmails.some((e) => normalizeEmail(e) === email)) errors.email = EMAIL_TAKEN;
  return errors;
}

export const EMAIL_TAKEN = "An account with this email already exists.";
