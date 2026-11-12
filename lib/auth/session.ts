import "server-only";
import { cookies } from "next/headers";
import {
  passwordStamp,
  readSessionToken,
  sessionSecret,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  type SessionClaims,
} from "./session-token";

// The login cookie (Phase 3, docs/plans/2026-11-10-fase-3-login.md). The token format is in
// lib/auth/session-token.ts. Who is logged in comes from getCurrentUser()
// (lib/auth/current-user.ts), which also checks the account in the database.

export const SESSION_COOKIE = "side_notes_session";

/**
 * Logs an account in: a new cookie every time, so a session from before the login is
 * never kept (no session fixation). Call it only from a Server Action or Route Handler,
 * after the password was verified.
 */
export async function createSession(user: { id: number; passwordHash: string }): Promise<void> {
  const secret = sessionSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const token = signSession(secret, { userId: user.id, expiresAt, stamp: passwordStamp(secret, user.passwordHash) });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Browsers accept secure cookies on http://localhost, so `next start` still works there,
    // but not over http to a LAN address (a phone on the same Wi-Fi): log in there with
    // `next dev`, or over https.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Logs out. Only from a Server Action (a POST), never a link a prefetch could follow. */
export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The claims of a valid, unexpired session cookie, or null. This does not mean the
 * account may log in: use getCurrentUser(), which checks the database too.
 */
export async function readSession(): Promise<SessionClaims | null> {
  const secret = sessionSecret();
  return readSessionToken(secret, (await cookies()).get(SESSION_COOKIE)?.value);
}
