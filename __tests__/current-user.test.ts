// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AccountRecord } from "../lib/data/auth";
import { passwordStamp, SESSION_MAX_AGE_SECONDS, signSession } from "../lib/auth/session-token";

// getCurrentUser with a fake cookie jar and a fake users table: the SQL itself is covered
// by the E2E login tests (Phase 3, day 5).
const jar = new Map<string, string>();
const accounts = new Map<number, AccountRecord>();
const options = new Map<string, unknown>();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string, opts: unknown) => {
      jar.set(name, value);
      options.set(name, opts);
    },
    delete: (name: string) => void jar.delete(name),
  }),
}));
vi.mock("@/lib/data/auth", () => ({
  getAccountById: async (id: number) => structuredClone(accounts.get(id) ?? null),
}));

const { getCurrentUser } = await import("../lib/auth/current-user");
const { createSession, deleteSession, SESSION_COOKIE } = await import("../lib/auth/session");

const SECRET = "a-test-secret-that-is-at-least-32-bytes-long";
const HASH = "scrypt$32768$8$1$rafi-salt-rafi-salt-ra$rafi-hash";

function addAccount(overrides: Partial<AccountRecord["user"]> = {}, passwordHash = HASH) {
  const user = {
    id: 2,
    name: "Rafi Pratama",
    email: "rafi@herald.test",
    role: "author" as const,
    isActive: true,
    bio: "",
    beat: "",
    ...overrides,
  };
  accounts.set(user.id, { user, passwordHash });
  return user;
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", SECRET);
  jar.clear();
  options.clear();
  accounts.clear();
});
afterEach(() => vi.unstubAllEnvs());

describe("getCurrentUser", () => {
  test("no cookie means nobody is logged in", async () => {
    addAccount();
    expect(await getCurrentUser()).toBeNull();
  });

  test("after createSession the account is the current user, without its password hash", async () => {
    const user = addAccount();
    await createSession({ id: 2, passwordHash: HASH });
    const current = await getCurrentUser();
    expect(current).toEqual(user);
    expect(JSON.stringify(current)).not.toContain(HASH);
    expect(jar.get(SESSION_COOKIE)).not.toContain(HASH);
  });

  test("role and active status come from the database, not the cookie", async () => {
    addAccount();
    await createSession({ id: 2, passwordHash: HASH });
    addAccount({ role: "admin" });
    expect(await getCurrentUser()).toMatchObject({ role: "admin" });
    addAccount({ isActive: false });
    expect(await getCurrentUser()).toBeNull();
  });

  test("a changed password ends sessions made before it", async () => {
    addAccount();
    await createSession({ id: 2, passwordHash: HASH });
    addAccount({}, "scrypt$32768$8$1$new-salt-new-salt-new$new-hash");
    expect(await getCurrentUser()).toBeNull();
  });

  test("a deleted account, a tampered cookie or an expired one is nobody", async () => {
    addAccount();
    await createSession({ id: 2, passwordHash: HASH });
    const valid = jar.get(SESSION_COOKIE)!;

    accounts.clear();
    expect(await getCurrentUser()).toBeNull();

    addAccount();
    addAccount({ id: 1, name: "Dewi Lestari", role: "admin" });
    jar.set(SESSION_COOKIE, valid.replace(/^2\./, "1."));
    expect(await getCurrentUser()).toBeNull();

    const expired = signSession(SECRET, {
      userId: 2,
      expiresAt: Math.floor(Date.now() / 1000) - 1,
      stamp: passwordStamp(SECRET, HASH),
    });
    jar.set(SESSION_COOKIE, expired);
    expect(await getCurrentUser()).toBeNull();
  });

  test("a cookie signed with an old secret is nobody", async () => {
    addAccount();
    await createSession({ id: 2, passwordHash: HASH });
    vi.stubEnv("SESSION_SECRET", "a-new-secret-that-is-at-least-32-bytes-long");
    expect(await getCurrentUser()).toBeNull();
  });

  test("without SESSION_SECRET it throws instead of trusting any cookie", async () => {
    jar.set(SESSION_COOKIE, "anything");
    vi.stubEnv("SESSION_SECRET", "");
    await expect(getCurrentUser()).rejects.toThrow(/SESSION_SECRET/);
    vi.stubEnv("SESSION_SECRET", "short");
    await expect(createSession({ id: 2, passwordHash: HASH })).rejects.toThrow(/SESSION_SECRET/);
  });

  test("deleteSession logs out", async () => {
    addAccount();
    await createSession({ id: 2, passwordHash: HASH });
    await deleteSession();
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("the session cookie", () => {
  test("is httpOnly, same-site lax and lasts seven days", async () => {
    await createSession({ id: 2, passwordHash: HASH });
    expect(options.get(SESSION_COOKIE)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    expect(SESSION_MAX_AGE_SECONDS).toBe(7 * 24 * 60 * 60);
  });

  test("is secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await createSession({ id: 2, passwordHash: HASH });
    expect(options.get(SESSION_COOKIE)).toMatchObject({ secure: true });
  });
});
