// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import type * as Actions from "../lib/articles/actions";
import type { User } from "../lib/types";

// The real saveDraft action with a fake user and fake writes: the SQL is covered by
// e2e/drafts.spec.ts (Phase 4, day 2).
const state = vi.hoisted(() => ({ user: null as User | null }));
const writes = vi.hoisted(() => ({
  createDraft: vi.fn<(authorId: number, fields: unknown) => Promise<number>>(async () => 41),
  updateDraft: vi.fn<(authorId: number, id: number, fields: unknown) => Promise<number | null>>(async (...args) => args[1]),
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireUser: async () => {
    if (!state.user) throw new Error("REDIRECT /login");
    return state.user;
  },
}));
vi.mock("@/lib/data/article-writes", () => writes);

const { saveDraft } = await vi.importActual<typeof Actions>("../lib/articles/actions");
const { updateTag } = await import("next/cache");

const RAFI: User = { id: 2, name: "Rafi Pratama", email: "rafi@herald.test", role: "author", isActive: true, bio: "", beat: "" };
type Input = Parameters<typeof saveDraft>[0];
const input: Input = { id: null, title: "  Library opens late ", summary: " Open until midnight. ", categorySlug: "academics", body: "<p>Hi</p>" };

beforeEach(() => {
  state.user = RAFI;
  writes.createDraft.mockClear();
  writes.updateDraft.mockClear();
  vi.mocked(updateTag).mockClear();
});

describe("saveDraft", () => {
  test("needs a login", async () => {
    state.user = null;
    await expect(saveDraft(input)).rejects.toThrow("REDIRECT /login");
    expect(writes.createDraft).not.toHaveBeenCalled();
  });

  test("a new draft is created for the logged-in author, trimmed, and the cache expires", async () => {
    const result = await saveDraft(input);
    expect(result).toMatchObject({ ok: true, id: 41 });
    expect(writes.createDraft).toHaveBeenCalledWith(2, {
      title: "Library opens late",
      summary: "Open until midnight.",
      categorySlug: "academics",
      body: "<p>Hi</p>",
    });
    expect(updateTag).toHaveBeenCalledWith("articles");
  });

  test("an existing draft is saved under the author's id, never the browser's", async () => {
    await saveDraft({ ...input, id: 19, authorId: 1 } as Input);
    expect(writes.updateDraft).toHaveBeenCalledWith(2, 19, expect.any(Object));
  });

  test("the body is sanitised before it is written", async () => {
    await saveDraft({ ...input, body: '<p>a<script>alert(1)</script><img src=x onerror=alert(1)></p>' });
    const [, fields] = writes.createDraft.mock.calls[0] as [number, { body: string }];
    expect(fields.body).toBe("<p>a</p>");
  });

  test("anything that is not the expected shape is refused without writing", async () => {
    for (const bad of [
      null,
      { ...input, title: 5 },
      { ...input, body: ["<p>x</p>"] },
      { ...input, summary: undefined },
      { ...input, id: "19" },
      { ...input, id: 0 },
      { ...input, id: 2 ** 31 },
      { ...input, id: 1.5 },
    ]) {
      const result = await saveDraft(bad as unknown as Input);
      expect(result.ok).toBe(false);
    }
    expect(writes.createDraft).not.toHaveBeenCalled();
    expect(writes.updateDraft).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  test("field errors come back without writing", async () => {
    const result = await saveDraft({ ...input, categorySlug: "" });
    expect(result).toEqual({ ok: false, errors: { category: "Choose a category." }, message: expect.any(String) });
    expect(writes.createDraft).not.toHaveBeenCalled();
  });

  test("someone else's, a pending or a missing article gets one answer, and nothing expires", async () => {
    writes.updateDraft.mockResolvedValueOnce(null);
    const result = await saveDraft({ ...input, id: 20 });
    expect(result).toMatchObject({ ok: false, message: expect.stringMatching(/cannot be saved here/) });
    expect(updateTag).not.toHaveBeenCalled();
  });

  test("a database error is not passed on to the browser", async () => {
    writes.createDraft.mockRejectedValueOnce(new Error('duplicate key value violates "articles_slug_key"'));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await saveDraft(input);
    expect(result).toEqual({ ok: false, errors: {}, message: "Could not save. Try again." });
    expect(JSON.stringify(result)).not.toContain("duplicate");
    log.mockRestore();
  });
});
