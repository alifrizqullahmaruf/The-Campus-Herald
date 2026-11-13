// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { AccountRecord } from "../lib/data/auth";
import type * as Actions from "../lib/auth/actions";
import { hashPassword } from "../lib/auth/password";
import { LOGIN_FAILED, MAX_PASSWORD_LENGTH } from "../lib/auth/login-rules";

// The real login and logout actions with a fake cookie jar, a fake users table and a
// redirect that throws like Next's does. The SQL is covered by the E2E login tests.
const jar = new Map<string, string>();
const accounts: AccountRecord[] = [];
const verified = vi.hoisted(() => [] as string[]);

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT ${path}`);
  },
}));
vi.mock("@/lib/data/auth", () => ({
  getAccountById: async (id: number) => structuredClone(accounts.find((a) => a.user.id === id) ?? null),
  getAccountByEmail: async (email: string) => {
    const found = accounts.filter((a) => a.user.email.toLowerCase() === email.toLowerCase());
    return found.length === 1 ? structuredClone(found[0]) : null;
  },
}));
// Records which stored value each check ran against, to see that every failure runs one.
vi.mock("@/lib/auth/password", async (original) => {
  const real = await original<typeof import("../lib/auth/password")>();
  return {
    ...real,
    verifyPassword: async (password: string, stored: string) => {
      verified.push(stored);
      return real.verifyPassword(password, stored);
    },
  };
});

const { login, logout } = await vi.importActual<typeof Actions>("../lib/auth/actions");
const { SESSION_COOKIE } = await import("../lib/auth/session");
const { getCurrentUser } = await import("../lib/auth/current-user");

const START = { error: null, email: "" };
let rafiHash = "";

function form(email: unknown, password: unknown) {
  const data = new FormData();
  if (email !== undefined) data.set("email", email as string);
  if (password !== undefined) data.set("password", password as string);
  return data;
}

function account(id: number, email: string, passwordHash: string, extra: Partial<AccountRecord["user"]> = {}): AccountRecord {
  return {
    user: { id, name: email, email, role: "author", isActive: true, bio: "", beat: "", ...extra },
    passwordHash,
  };
}

beforeAll(async () => {
  rafiHash = await hashPassword("correct horse battery");
});

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", "a-test-secret-that-is-at-least-32-bytes-long");
  jar.clear();
  verified.length = 0;
  accounts.length = 0;
  accounts.push(
    account(2, "rafi@herald.test", rafiHash),
    account(1, "dewi.admin@herald.test", rafiHash, { role: "admin" }),
    account(7, "laras@herald.test", rafiHash, { isActive: false }),
  );
});

describe("login", () => {
  test("the right password sets the cookie and opens the author's dashboard", async () => {
    await expect(login(START, form(" Rafi@Herald.test ", "correct horse battery"))).rejects.toThrow("REDIRECT /dashboard");
    expect(jar.has(SESSION_COOKIE)).toBe(true);
    expect(await getCurrentUser()).toMatchObject({ id: 2 });
  });

  test("the editor lands on the review queue", async () => {
    await expect(login(START, form("dewi.admin@herald.test", "correct horse battery"))).rejects.toThrow(
      "REDIRECT /dashboard/review",
    );
  });

  test("a wrong password, an unknown email and a deactivated account get the same answer", async () => {
    const attempts = [
      form("rafi@herald.test", "wrong password"),
      form("nobody@herald.test", "correct horse battery"),
      form("laras@herald.test", "correct horse battery"),
    ];
    for (const data of attempts) {
      expect(await login(START, data)).toEqual({ error: LOGIN_FAILED, email: data.get("email") });
    }
    expect(jar.size).toBe(0);
    // Each failure ran scrypt once: unknown and deactivated accounts against "", which never verifies.
    expect(verified).toEqual([rafiHash, "", ""]);
  });

  test("two accounts that differ only in case cannot log in", async () => {
    accounts.push(account(9, "RAFI@herald.test", rafiHash));
    expect(await login(START, form("rafi@herald.test", "correct horse battery"))).toMatchObject({ error: LOGIN_FAILED });
    expect(jar.size).toBe(0);
  });

  test("missing, empty, malformed or oversized fields are refused before any lookup", async () => {
    const file = new File(["x"], "password.txt");
    const attempts: [unknown, unknown][] = [
      [undefined, undefined],
      ["rafi@herald.test", ""],
      ["rafi@herald.test", file],
      ["not an email", "correct horse battery"],
      ["rafi@herald.test", "x".repeat(MAX_PASSWORD_LENGTH + 1)],
    ];
    for (const [email, password] of attempts) {
      const state = await login(START, form(email, password));
      expect(state.error).toBeTruthy();
    }
    expect(verified).toEqual([]);
    expect(jar.size).toBe(0);
  });

  test("a new login replaces an older session cookie", async () => {
    jar.set(SESSION_COOKIE, "an-old-or-planted-value");
    await expect(login(START, form("rafi@herald.test", "correct horse battery"))).rejects.toThrow("REDIRECT");
    expect(jar.get(SESSION_COOKIE)).not.toBe("an-old-or-planted-value");
    expect(await getCurrentUser()).toMatchObject({ id: 2 });
  });
});

describe("logout", () => {
  test("removes the cookie and goes to the login page", async () => {
    await expect(login(START, form("rafi@herald.test", "correct horse battery"))).rejects.toThrow("REDIRECT");
    await expect(logout()).rejects.toThrow("REDIRECT /login");
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(await getCurrentUser()).toBeNull();
  });
});
