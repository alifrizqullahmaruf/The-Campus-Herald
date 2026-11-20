"use server";

import { updateTag } from "next/cache";
import { insertAuthor, setActive, setPasswordHash } from "../data/user-writes";
import { isValidId } from "../data/ids";
import { EMAIL_TAKEN, normalizeEmail, validateNewAuthor, type NewAuthorErrors } from "./author-rules";
import { requireAdmin } from "./current-user";
import { hashPassword } from "./password";
import { temporaryPassword } from "./temporary-password";

// Managing author accounts (Phase 4 day 5, docs/plans/2026-11-17-fase-4-alur-kerja.md). Each
// action checks the administrator first; anything from the browser is untrusted. A
// temporary password is returned once, to be given to the author in person, and is never
// logged or stored as such.

type Failure = { ok: false; errors?: NewAuthorErrors; message: string };
export type CreateAuthorResult = { ok: true; id: number; email: string; temporaryPassword: string } | Failure;
export type SetActiveResult = { ok: true; isActive: boolean } | Failure;
export type ResetPasswordResult = { ok: true; temporaryPassword: string } | Failure;

const FAILED = "Could not save the change. Try again.";
const GONE = "That author account was not found. Reload the page.";

function logFailure(name: string, error: unknown) {
  console.error(`${name} failed`, error instanceof Error ? error.message : error);
}

/** A new author account with a temporary password, shown once. */
export async function createAuthor(input: { name: string; email: string }): Promise<CreateAuthorResult> {
  await requireAdmin();
  const raw = input as Record<string, unknown> | null;
  const name = typeof raw?.name === "string" ? raw.name.trim() : null;
  const email = typeof raw?.email === "string" ? normalizeEmail(raw.email) : null;
  if (name === null || email === null) return { ok: false, message: FAILED };
  const errors = validateNewAuthor({ name, email });
  if (Object.keys(errors).length > 0) return { ok: false, errors, message: "Fix the highlighted fields." };

  const password = temporaryPassword();
  let id: number | "taken";
  try {
    id = await insertAuthor({ name, email, passwordHash: await hashPassword(password) });
  } catch (error) {
    logFailure("createAuthor", error);
    return { ok: false, message: FAILED };
  }
  if (id === "taken") return { ok: false, errors: { email: EMAIL_TAKEN }, message: "Fix the highlighted fields." };
  updateTag("users");
  return { ok: true, id, email, temporaryPassword: password };
}

/** Stops or allows an author's logins. A deactivated author is logged out at once. */
export async function setAuthorActive(id: number, active: boolean): Promise<SetActiveResult> {
  await requireAdmin();
  if (typeof id !== "number" || !isValidId(id) || typeof active !== "boolean") return { ok: false, message: GONE };
  let name: string | null;
  try {
    name = await setActive(id, active);
  } catch (error) {
    logFailure("setAuthorActive", error);
    return { ok: false, message: FAILED };
  }
  if (name === null) return { ok: false, message: GONE };
  updateTag("users");
  return { ok: true, isActive: active };
}

/** A new temporary password for an author, shown once; their earlier logins end. */
export async function resetAuthorPassword(id: number): Promise<ResetPasswordResult> {
  await requireAdmin();
  if (typeof id !== "number" || !isValidId(id)) return { ok: false, message: GONE };
  const password = temporaryPassword();
  let name: string | null;
  try {
    name = await setPasswordHash(id, await hashPassword(password));
  } catch (error) {
    logFailure("resetAuthorPassword", error);
    return { ok: false, message: FAILED };
  }
  if (name === null) return { ok: false, message: GONE };
  // Nothing cached shows a password, so no cache tag is expired here.
  return { ok: true, temporaryPassword: password };
}
