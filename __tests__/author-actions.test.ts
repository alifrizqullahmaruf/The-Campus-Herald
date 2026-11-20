// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import type * as Actions from "../lib/auth/author-actions";
import type { User } from "../lib/types";
import { verifyPassword } from "../lib/auth/password";

// The real author actions with a fake administrator and fake writes: the SQL is covered by
// e2e/authors.spec.ts (Phase 4, day 5).
const state = vi.hoisted(() => ({ user: null as User | null }));
const writes = vi.hoisted(() => ({
  insertAuthor: vi.fn<(fields: { name: string; email: string; passwordHash: string }) => Promise<number | "taken">>(
    async () => 41,
  ),
  setActive: vi.fn<(id: number, active: boolean) => Promise<string | null>>(async () => "Rafi Pratama"),
  setPasswordHash: vi.fn<(id: number, hash: string) => Promise<string | null>>(async () => "Rafi Pratama"),
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireAdmin: async () => {
    if (!state.user) throw new Error("REDIRECT /login");
    if (state.user.role !== "admin") throw new Error("REDIRECT /dashboard");
    return state.user;
  },
}));
vi.mock("@/lib/data/user-writes", () => writes);

const { createAuthor, resetAuthorPassword, setAuthorActive } = await vi.importActual<typeof Actions>(
  "../lib/auth/author-actions",
);
const { temporaryPassword, TEMPORARY_ALPHABET } = await import("../lib/auth/temporary-password");
const { updateTag } = await import("next/cache");

const DEWI: User = { id: 1, name: "Dewi Lestari", email: "dewi.admin@herald.test", role: "admin", isActive: true, bio: "", beat: "" };
const RAFI: User = { ...DEWI, id: 2, name: "Rafi Pratama", email: "rafi@herald.test", role: "author" };

beforeEach(() => {
  state.user = DEWI;
  for (const fn of Object.values(writes)) fn.mockClear();
  vi.mocked(updateTag).mockClear();
});

describe("temporaryPassword", () => {
  test("four groups of four characters that cannot be mixed up", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      const password = temporaryPassword();
      expect(password).toMatch(/^[a-z2-9]{4}(-[a-z2-9]{4}){3}$/);
      expect(password).not.toMatch(/[01ilo]/);
      seen.add(password);
    }
    expect(seen.size).toBe(50);
    expect(TEMPORARY_ALPHABET).not.toMatch(/[01ilo]/);
  });
});

describe("author actions", () => {
  test("only the administrator manages accounts", async () => {
    for (const user of [null, RAFI]) {
      state.user = user;
      await expect(createAuthor({ name: "A", email: "a@herald.test" })).rejects.toThrow(/REDIRECT/);
      await expect(setAuthorActive(2, false)).rejects.toThrow(/REDIRECT/);
      await expect(resetAuthorPassword(2)).rejects.toThrow(/REDIRECT/);
    }
    for (const fn of Object.values(writes)) expect(fn).not.toHaveBeenCalled();
  });

  test("a new author gets a lower-case email and a temporary password, stored only as a hash", async () => {
    const log = vi.spyOn(console, "error");
    const result = await createAuthor({ name: "  Dina Kusuma ", email: " Dina@Herald.test " });
    expect(result).toMatchObject({ ok: true, id: 41, email: "dina@herald.test" });
    const [fields] = writes.insertAuthor.mock.calls[0];
    expect(fields).toMatchObject({ name: "Dina Kusuma", email: "dina@herald.test" });
    if (!result.ok) throw new Error("expected success");
    expect(fields.passwordHash).not.toContain(result.temporaryPassword);
    expect(await verifyPassword(result.temporaryPassword, fields.passwordHash)).toBe(true);
    expect(updateTag).toHaveBeenCalledWith("users");
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  test("an email that is taken, or fields that do not pass, are refused", async () => {
    writes.insertAuthor.mockResolvedValueOnce("taken");
    expect(await createAuthor({ name: "Rafi", email: "RAFI@herald.test" })).toMatchObject({
      ok: false,
      errors: { email: "An account with this email already exists." },
    });
    expect(updateTag).not.toHaveBeenCalled();
    for (const bad of [null, { name: 1, email: "a@herald.test" }, { name: "A", email: "not an email" }, { name: "", email: "a@herald.test" }]) {
      expect((await createAuthor(bad as unknown as { name: string; email: string })).ok).toBe(false);
    }
    expect(writes.insertAuthor).toHaveBeenCalledTimes(1);
  });

  test("deactivating and reactivating", async () => {
    expect(await setAuthorActive(2, false)).toEqual({ ok: true, isActive: false });
    expect(writes.setActive).toHaveBeenCalledWith(2, false);
    expect(updateTag).toHaveBeenCalledWith("users");
    expect(await setAuthorActive(2, true)).toEqual({ ok: true, isActive: true });
  });

  test("a reset returns a new temporary password and stores its hash", async () => {
    const result = await resetAuthorPassword(2);
    if (!result.ok) throw new Error("expected success");
    const [id, hash] = writes.setPasswordHash.mock.calls[0];
    expect(id).toBe(2);
    expect(await verifyPassword(result.temporaryPassword, hash)).toBe(true);
    // Nothing cached shows a password.
    expect(updateTag).not.toHaveBeenCalled();
  });

  test("an id that is not valid, or not an author's account, gets one answer", async () => {
    for (const id of ["2", 0, 1.5, 2 ** 31, null]) {
      expect((await setAuthorActive(id as number, false)).ok).toBe(false);
      expect((await resetAuthorPassword(id as number)).ok).toBe(false);
    }
    expect((await setAuthorActive(2, "no" as unknown as boolean)).ok).toBe(false);
    expect(writes.setActive).not.toHaveBeenCalled();
    writes.setActive.mockResolvedValueOnce(null);
    writes.setPasswordHash.mockResolvedValueOnce(null);
    expect(await setAuthorActive(1, false)).toMatchObject({ ok: false, message: expect.stringMatching(/not found/) });
    expect(await resetAuthorPassword(1)).toMatchObject({ ok: false, message: expect.stringMatching(/not found/) });
    expect(updateTag).not.toHaveBeenCalled();
  });

  test("a database error stays on the server", async () => {
    writes.insertAuthor.mockRejectedValueOnce(new Error("connection reset"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await createAuthor({ name: "A", email: "a@herald.test" })).toEqual({
      ok: false,
      message: "Could not save the change. Try again.",
    });
    log.mockRestore();
  });
});
