"use server";

import { redirect } from "next/navigation";
import { getAccountByEmail } from "../data/auth";
import { homeFor, LOGIN_FAILED, validateLogin } from "./login-rules";
import { verifyPassword } from "./password";
import { createSession, deleteSession } from "./session";

// Log in and log out (Phase 3, docs/plans/2026-11-10-fase-3-login.md). Server Actions are
// POSTs that Next.js checks against the page's origin, so another site cannot submit them.

export interface LoginState {
  error: string | null;
  /** What was typed, so a failed attempt does not clear the email field. */
  email: string;
}

/** The login form's action (useActionState): an error to show, or a redirect to the dashboard. */
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  // formData.get gives null for a missing field and a File for an upload.
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const echo = email.slice(0, 254);

  const problem = validateLogin(email, password);
  if (problem) return { error: problem, email: echo };

  const account = await getAccountByEmail(email);
  // Unknown and deactivated accounts still pay for one scrypt run ("" never verifies), so
  // the answer takes as long as a wrong password and says the same thing.
  const usable = account !== null && account.user.isActive;
  const ok = await verifyPassword(password, usable ? account.passwordHash : "");
  if (!usable || !ok) return { error: LOGIN_FAILED, email: echo };

  await createSession({ id: account.user.id, passwordHash: account.passwordHash });
  redirect(homeFor(account.user.role));
}

/** Logs out and goes to the login page. A form POST, so no link or prefetch can trigger it. */
export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
