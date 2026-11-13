// Login form rules shared by the browser (an early hint) and the Server Action (the real
// check), Phase 3 (docs/plans/2026-11-10-fase-3-login.md). No server code here.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Longest accepted email (RFC 5321) and password; longer values are refused unhashed. */
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PASSWORD_LENGTH = 1024;

/** The one message for a wrong email, a wrong password and a deactivated account. */
export const LOGIN_FAILED = "That email and password do not match an active account.";

/** A problem with what was typed, before any account is looked up, or null. */
export function validateLogin(email: string, password: string): string | null {
  if (!email.trim() || !password) return "Enter your email and password.";
  if (email.trim().length > MAX_EMAIL_LENGTH || !EMAIL.test(email.trim())) return "That email address does not look right.";
  if (password.length > MAX_PASSWORD_LENGTH) return LOGIN_FAILED;
  return null;
}

/** Where an account goes after logging in: the review queue for the editor, else their articles. */
export function homeFor(role: "author" | "admin"): "/dashboard" | "/dashboard/review" {
  return role === "admin" ? "/dashboard/review" : "/dashboard";
}
