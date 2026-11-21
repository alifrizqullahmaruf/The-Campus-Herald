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
  submitArticle: vi.fn<(authorId: number, id: number | null, fields: unknown) => Promise<number | null>>(
    async (...args) => args[1] ?? 42,
  ),
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireUser: async () => {
    if (!state.user) throw new Error("REDIRECT /login");
    return state.user;
  },
}));
vi.mock("@/lib/data/article-writes", () => writes);

const { saveDraft, submitForReview } = await vi.importActual<typeof Actions>("../lib/articles/actions");
const { updateTag } = await import("next/cache");

const RAFI: User = { id: 2, name: "Rafi Pratama", email: "rafi@herald.test", role: "author", isActive: true, bio: "", beat: "" };
type Input = Parameters<typeof saveDraft>[0];
const input: Input = {
  id: null,
  title: "  Library opens late ",
  summary: " Open until midnight. ",
  categorySlug: "academics",
  body: "<p>Hi</p>",
  coverImage: null,
  coverAlt: "",
};
const UPLOAD = "/uploads/0f8e3c2a-1b4d-4e5f-9a6b-7c8d9e0f1a2b.webp";

beforeEach(() => {
  state.user = RAFI;
  writes.createDraft.mockClear();
  writes.updateDraft.mockClear();
  writes.submitArticle.mockClear();
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
      coverImage: null,
      coverAlt: "",
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

describe("submitForReview", () => {
  const complete: Input = { ...input, body: "<p>The first paragraph.</p>" };

  test("needs a login", async () => {
    state.user = null;
    await expect(submitForReview(complete)).rejects.toThrow("REDIRECT /login");
    expect(writes.submitArticle).not.toHaveBeenCalled();
  });

  test("a complete article goes to review for the logged-in author, and the cache expires", async () => {
    expect(await submitForReview({ ...complete, id: 19 })).toEqual({ ok: true, id: 19, status: "pending" });
    expect(writes.submitArticle).toHaveBeenCalledWith(2, 19, {
      title: "Library opens late",
      summary: "Open until midnight.",
      categorySlug: "academics",
      body: "<p>The first paragraph.</p>",
      coverImage: null,
      coverAlt: "",
    });
    expect(updateTag).toHaveBeenCalledWith("articles");
    expect(await submitForReview(complete)).toEqual({ ok: true, id: 42, status: "pending" });
    expect(writes.submitArticle).toHaveBeenLastCalledWith(2, null, expect.any(Object));
  });

  test("a title, a summary, a topic and a body are required", async () => {
    const result = await submitForReview({ ...complete, id: 19, title: " ", summary: "", body: "<p></p>" });
    expect(result).toMatchObject({
      ok: false,
      errors: {
        title: "Give the article a title.",
        summary: "Write a short summary.",
        body: "Write the article before submitting it.",
      },
    });
    expect(writes.submitArticle).not.toHaveBeenCalled();
  });

  test("a body that is only a script counts as empty, since it is checked after sanitising", async () => {
    const result = await submitForReview({ ...complete, body: "<script>alert(1)</script><p> </p>" });
    expect(result).toMatchObject({ ok: false, errors: { body: "Write the article before submitting it." } });
    expect(writes.submitArticle).not.toHaveBeenCalled();
  });

  test("someone else's, a pending or a missing article gets one answer, and nothing expires", async () => {
    writes.submitArticle.mockResolvedValueOnce(null);
    const result = await submitForReview({ ...complete, id: 20 });
    expect(result).toMatchObject({ ok: false, message: expect.stringMatching(/cannot be saved here/) });
    expect(updateTag).not.toHaveBeenCalled();
  });

  test("input that is not the expected shape is refused without writing", async () => {
    for (const bad of [null, { ...complete, body: 1 }, { ...complete, id: "19" }]) {
      expect((await submitForReview(bad as unknown as Input)).ok).toBe(false);
    }
    expect(writes.submitArticle).not.toHaveBeenCalled();
  });
});

describe("cover fields", () => {
  test("an uploaded cover and its description travel with the article, trimmed", async () => {
    await saveDraft({ ...input, coverImage: UPLOAD, coverAlt: "  Students at the library  " });
    expect(writes.createDraft).toHaveBeenCalledWith(2, expect.objectContaining({ coverImage: UPLOAD, coverAlt: "Students at the library" }));
  });

  test("a cover that is not text, too long, or a description over 255 characters is refused", async () => {
    for (const bad of [
      { ...input, coverImage: 5 },
      { ...input, coverAlt: null },
      { ...input, coverImage: `/uploads/${"a".repeat(600)}` },
      { ...input, coverImage: UPLOAD, coverAlt: "a".repeat(256) },
    ]) {
      expect((await saveDraft(bad as unknown as Input)).ok).toBe(false);
    }
    expect(writes.createDraft).not.toHaveBeenCalled();
  });

  test("submitting with a cover needs a description of it", async () => {
    const result = await submitForReview({ ...input, body: "<p>Text.</p>", coverImage: UPLOAD, coverAlt: " " });
    expect(result).toMatchObject({ ok: false, errors: { coverAlt: "Describe the cover image." } });
    expect(writes.submitArticle).not.toHaveBeenCalled();
  });
});
