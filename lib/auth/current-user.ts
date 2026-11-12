import "server-only";
import { cache } from "react";
import { getAccountById } from "../data/auth";
import type { User } from "../types";
import { readSession } from "./session";
import { sessionSecret, stampMatches } from "./session-token";

// Who is logged in (Phase 3, docs/plans/2026-11-10-fase-3-login.md). Every page, layout and
// Server Action that needs the user calls this itself: the cookie only says who logged
// in, and the database says whether that still counts. React's cache() shares the answer
// within one request only; nothing is kept between requests.

/**
 * The logged-in user, or null when there is no valid session, the account is gone or
 * deactivated, or its password changed after the login. Role and active status come from
 * the database, never from the cookie. Throws if SESSION_SECRET is missing or too short.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const secret = sessionSecret();
  const session = await readSession();
  if (!session) return null;
  const account = await getAccountById(session.userId);
  if (!account || !account.user.isActive) return null;
  if (!stampMatches(secret, account.passwordHash, session.stamp)) return null;
  return account.user;
});
