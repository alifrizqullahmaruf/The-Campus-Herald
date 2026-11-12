// @vitest-environment node
import { describe, expect, test } from "vitest";
import {
  passwordStamp,
  readSessionToken,
  SESSION_MAX_AGE_SECONDS,
  sessionSecret,
  signSession,
  stampMatches,
} from "../lib/auth/session-token";

const SECRET = "a-test-secret-that-is-at-least-32-bytes-long";
const NOW = 1_800_000_000;
const HASH = "scrypt$32768$8$1$saltsaltsaltsaltsaltsa$hash";

function token(overrides: Partial<{ userId: number; expiresAt: number; stamp: string }> = {}) {
  return signSession(SECRET, {
    userId: 2,
    expiresAt: NOW + SESSION_MAX_AGE_SECONDS,
    stamp: passwordStamp(SECRET, HASH),
    ...overrides,
  });
}

describe("session secret", () => {
  test("a missing or short secret stops the app instead of falling back", () => {
    expect(() => sessionSecret(undefined)).toThrow(/SESSION_SECRET/);
    expect(() => sessionSecret("")).toThrow(/SESSION_SECRET/);
    expect(() => sessionSecret("x".repeat(31))).toThrow(/SESSION_SECRET/);
    expect(sessionSecret("x".repeat(32))).toBe("x".repeat(32));
  });
});

describe("session token", () => {
  test("a signed token reads back as the same claims", () => {
    expect(readSessionToken(SECRET, token(), NOW)).toEqual({
      userId: 2,
      expiresAt: NOW + SESSION_MAX_AGE_SECONDS,
      stamp: passwordStamp(SECRET, HASH),
    });
  });

  test("a token signed with another secret is not a session", () => {
    const other = signSession("another-secret-that-is-at-least-32-bytes", {
      userId: 2,
      expiresAt: NOW + 60,
      stamp: passwordStamp(SECRET, HASH),
    });
    expect(readSessionToken(SECRET, other, NOW)).toBeNull();
  });

  test("an expired token, or one longer than seven days, is not a session", () => {
    expect(readSessionToken(SECRET, token({ expiresAt: NOW }), NOW)).toBeNull();
    expect(readSessionToken(SECRET, token({ expiresAt: NOW - 1 }), NOW)).toBeNull();
    expect(readSessionToken(SECRET, token({ expiresAt: NOW + 1 }), NOW)).not.toBeNull();
    expect(readSessionToken(SECRET, token({ expiresAt: NOW + SESSION_MAX_AGE_SECONDS + 1 }), NOW)).toBeNull();
  });

  test("changing any part breaks the signature", () => {
    const valid = token();
    const [id, expires, stamp, signature] = valid.split(".");
    const tampered = [
      `1.${expires}.${stamp}.${signature}`,
      `${id}.${Number(expires) + 1}.${stamp}.${signature}`,
      `${id}.${expires}.${passwordStamp(SECRET, "other")}.${signature}`,
      `${id}.${expires}.${stamp}.${signature.replace(/^./, (c) => (c === "A" ? "B" : "A"))}`,
      // The same values spelled differently.
      `0${id}.${expires}.${stamp}.${signature}`,
      `${id}.${expires}.${stamp}.${signature}=`,
      ` ${valid}`,
      `${valid}.extra`,
      "",
      "garbage",
    ];
    for (const value of tampered) expect(readSessionToken(SECRET, value, NOW), value).toBeNull();
    expect(readSessionToken(SECRET, undefined, NOW)).toBeNull();
  });

  test("a stamp is not a signature: the two use different labels", () => {
    const [id, expires, stamp] = token().split(".");
    // Using the stamp's HMAC where the signature goes must not verify.
    const forged = `${id}.${expires}.${stamp}.${passwordStamp(SECRET, `${id}.${expires}.${stamp}`)}`;
    expect(readSessionToken(SECRET, forged, NOW)).toBeNull();
  });

  test("ids that are not database ids are refused, even when signed", () => {
    expect(() => token({ userId: 0 })).toThrow();
    expect(readSessionToken(SECRET, token({ userId: 2147483648 }), NOW)).toBeNull();
  });
});

describe("password stamp", () => {
  test("matches only the hash it was made from, and never contains it", () => {
    const stamp = passwordStamp(SECRET, HASH);
    expect(stamp).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(HASH).not.toContain(stamp);
    expect(stampMatches(SECRET, HASH, stamp)).toBe(true);
    expect(stampMatches(SECRET, `${HASH}x`, stamp)).toBe(false);
    expect(stampMatches("another-secret-that-is-at-least-32-bytes", HASH, stamp)).toBe(false);
    expect(stampMatches(SECRET, HASH, "")).toBe(false);
  });
});
