// @vitest-environment node
import { describe, expect, test } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth/password";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
// 86 base64url characters carry 516 bits for 64 bytes: the last 4 bits are ignored.
function spareBits(char: string) {
  return ALPHABET[ALPHABET.indexOf(char) ^ 1];
}

describe("password hashing", () => {
  test("a hash verifies its own password and no other", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).toMatch(/^scrypt\$32768\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batter", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  test("the same password gets a different salt each time", async () => {
    const [a, b] = await Promise.all([hashPassword("same"), hashPassword("same")]);
    expect(a).not.toBe(b);
    expect(await verifyPassword("same", a)).toBe(true);
    expect(await verifyPassword("same", b)).toBe(true);
  });

  test("Unicode that looks the same verifies the same", async () => {
    // "é" as one code point, then as "e" plus a combining accent.
    const hash = await hashPassword("caf\u00e9");
    expect(await verifyPassword("cafe\u0301", hash)).toBe(true);
  });

  test("a lone surrogate is not a password", async () => {
    const lone = String.fromCharCode(0xd800);
    await expect(hashPassword(lone)).rejects.toThrow();
    // It would otherwise be hashed as U+FFFD and match this password.
    const hash = await hashPassword(String.fromCharCode(0xfffd));
    expect(await verifyPassword(lone, hash)).toBe(false);
  });

  test("anything not in exactly this format is a mismatch", async () => {
    const hash = await hashPassword("secret password");
    const [, n, r, p, salt, key] = hash.split("$");
    const rejected = [
      // The seed's value for accounts that may not log in (docs/plans/2026-11-02-fase-2-database.md).
      "!no-login",
      "",
      "scrypt",
      hash.slice(0, -1),
      `${hash}$extra`,
      `${hash}=`,
      ` ${hash}`,
      `bcrypt$${n}$${r}$${p}$${salt}$${key}`,
      // Parameters other than the ones used: a cheap N, an expensive N, other r and p.
      `scrypt$2$${r}$${p}$${salt}$${key}`,
      `scrypt$1048576$${r}$${p}$${salt}$${key}`,
      `scrypt$${n}$1$${p}$${salt}$${key}`,
      `scrypt$${n}$${r}$2$${salt}$${key}`,
      `scrypt$032768$${r}$${p}$${salt}$${key}`,
      // An empty key or salt, which a looser check would compare as equal.
      `scrypt$${n}$${r}$${p}$${salt}$`,
      `scrypt$${n}$${r}$${p}$$${key}`,
      `scrypt$${n}$${r}$${p}$${salt}$${key.slice(0, 43)}`,
      `scrypt$${n}$${r}$${p}$${salt}$${key.replace(/^./, "+")}`,
      // The same bytes spelled differently: the last character has spare bits.
      `scrypt$${n}$${r}$${p}$${salt}$${key.slice(0, -1)}${spareBits(key.at(-1)!)}`,
    ];
    for (const stored of rejected) {
      expect(await verifyPassword("secret password", stored), stored).toBe(false);
    }
  });
});
