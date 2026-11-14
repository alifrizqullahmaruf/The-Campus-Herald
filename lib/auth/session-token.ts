// The signed session token kept in the login cookie (Phase 3, docs/plans/2026-11-10-fase-3-login.md).
// Pure functions with no Next.js imports, so the unit tests can cover them; the cookie
// itself is set and read in lib/auth/session.ts.
//
// Token: `<userId>.<expiresAt>.<stamp>.<signature>`
// - expiresAt: Unix time in seconds.
// - stamp: an HMAC of the account's password_hash (never the hash itself). The current
//   user check compares it with the hash in the database, so changing a password ends
//   every session made before the change, without a sessions table.
// - signature: an HMAC-SHA256 of the other three parts with SESSION_SECRET.

import { createHmac, timingSafeEqual } from "node:crypto";
import { isValidId } from "../data/ids";

/** The login cookie's name; proxy.ts checks only that it is there. */
export const SESSION_COOKIE = "side_notes_session";

/** Seven days, the session length chosen for Phase 3. */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const MIN_SECRET_BYTES = 32;

// 16 bytes are 22 base64url characters, 32 bytes are 43. Ids and times are plain
// decimals without leading zeros, so every session has exactly one spelling.
const TOKEN = /^([1-9]\d{0,9})\.([1-9]\d{0,11})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/;

export interface SessionClaims {
  userId: number;
  /** Unix time in seconds. */
  expiresAt: number;
  stamp: string;
}

/**
 * SESSION_SECRET, or an error. There is no fallback value: a missing or short secret
 * would let anyone sign a session, so the app stops instead (fail closed).
 */
export function sessionSecret(value: string | undefined = process.env.SESSION_SECRET): string {
  if (!value || Buffer.byteLength(value, "utf8") < MIN_SECRET_BYTES) {
    throw new Error(
      `SESSION_SECRET is missing or shorter than ${MIN_SECRET_BYTES} bytes. ` +
        "On this computer `npm run db:seed` adds one to .env.local; elsewhere set it to a random value.",
    );
  }
  return value;
}

// The label keeps a stamp from ever being valid as a signature and the other way round.
function hmac(secret: string, label: string, data: string): Buffer {
  return createHmac("sha256", secret).update(`${label}\0${data}`).digest();
}

/** The stamp of a password hash: 16 bytes of its HMAC, in base64url. */
export function passwordStamp(secret: string, passwordHash: string): string {
  return hmac(secret, "side-notes password", passwordHash).subarray(0, 16).toString("base64url");
}

/** Whether a stamp from a session belongs to this password hash. */
export function stampMatches(secret: string, passwordHash: string, stamp: string): boolean {
  return equalText(passwordStamp(secret, passwordHash), stamp);
}

function sign(secret: string, payload: string): string {
  return hmac(secret, "side-notes session", payload).toString("base64url");
}

/** The token for a session. */
export function signSession(secret: string, claims: SessionClaims): string {
  const payload = `${claims.userId}.${claims.expiresAt}.${claims.stamp}`;
  if (!TOKEN.test(`${payload}.${"A".repeat(43)}`)) throw new Error("These session claims cannot be signed.");
  return `${payload}.${sign(secret, payload)}`;
}

/**
 * The claims of a token signed with this secret that has not expired, or null. Anything
 * else (a missing, tampered, expired or differently spelled token) is null.
 */
export function readSessionToken(
  secret: string,
  token: string | undefined,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): SessionClaims | null {
  if (!token) return null;
  const match = TOKEN.exec(token);
  if (!match) return null;
  const [, id, expires, stamp, signature] = match;
  if (!equalText(sign(secret, `${id}.${expires}.${stamp}`), signature)) return null;
  const userId = Number(id);
  const expiresAt = Number(expires);
  if (!isValidId(userId)) return null;
  // A signed token never lasts longer than one session; a longer one was not made here.
  if (expiresAt <= nowSeconds || expiresAt > nowSeconds + SESSION_MAX_AGE_SECONDS) return null;
  return { userId, expiresAt, stamp };
}

// Constant-time comparison of two ASCII strings; different lengths are simply unequal.
function equalText(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}
