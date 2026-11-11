// Password hashing with scrypt from node:crypto (Phase 3, docs/plans/2026-11-10-fase-3-login.md).
// Stored as `scrypt$N$r$p$salt$hash` (base64url). Used by the login and by the scripts.

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const N = 32768;
const R = 8;
const P = 1;
const KEY_BYTES = 64;
const SALT_BYTES = 16;
// scrypt needs 128 * N * r bytes (32 MiB here); the default limit is exactly that.
const MAXMEM = 64 * 1024 * 1024;

// 16 bytes are 22 base64url characters, 64 bytes are 86. Anything else is not a hash
// this module made: the "!no-login" seed value, an empty string, or a tampered value.
const STORED = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{86})$/;

// Used when there is no real hash to check against, so a failed check costs the same
// time either way and does not tell which emails have an account.
const DUMMY_SALT = Buffer.alloc(SALT_BYTES);

function derive(password: string, salt: Buffer): Promise<Buffer> {
  const options: ScryptOptions = { N, r: R, p: P, maxmem: MAXMEM };
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_BYTES, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

/** Hashes a password with a new random salt. */
export async function hashPassword(password: string): Promise<string> {
  // A lone surrogate would be hashed as U+FFFD, so two different passwords would match.
  if (!password.isWellFormed()) throw new Error("The password contains an invalid character.");
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

/**
 * Whether the password matches a stored hash. Any value not in exactly this module's
 * format and parameters is a mismatch: parameters read from the stored value could
 * otherwise be made trivial or ruinously expensive. A mismatch still runs scrypt once
 * with the fixed parameters, so pass "" for an unknown email or an inactive account and
 * every failed login takes the same time.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const key = parse(stored);
  if (!key || !password.isWellFormed()) {
    await derive(password.isWellFormed() ? password : "", DUMMY_SALT);
    return false;
  }
  const actual = await derive(password, key.salt);
  return timingSafeEqual(actual, key.expected);
}

/** The salt and key of a stored hash in exactly this module's form, or null. */
function parse(stored: string): { salt: Buffer; expected: Buffer } | null {
  const match = STORED.exec(stored);
  if (!match) return null;
  const [, n, r, p, saltText, keyText] = match;
  // Compared as text, so "032768" is not taken for 32768.
  if (n !== String(N) || r !== String(R) || p !== String(P)) return null;
  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(keyText, "base64url");
  // base64url leaves a few spare bits in the last character; re-encoding rejects the
  // other spellings of the same bytes, so each hash has one stored form.
  if (salt.toString("base64url") !== saltText || expected.toString("base64url") !== keyText) return null;
  if (salt.length !== SALT_BYTES || expected.length !== KEY_BYTES) return null;
  return { salt, expected };
}
