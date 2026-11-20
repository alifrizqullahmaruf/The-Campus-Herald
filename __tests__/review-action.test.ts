// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import type * as Actions from "../lib/articles/review-actions";
import type { User } from "../lib/types";

// The real review actions with a fake user and a fake write: the SQL is covered by
// e2e/review.spec.ts (Phase 4, day 4).
const state = vi.hoisted(() => ({ user: null as User | null }));
const writes = vi.hoisted(() => ({
  reviewArticle: vi.fn<(reviewerId: number, id: number, decision: unknown) => Promise<number | null>>(
    async (...args) => args[1],
  ),
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireAdmin: async () => {
    if (!state.user) throw new Error("REDIRECT /login");
    if (state.user.role !== "admin") throw new Error("REDIRECT /dashboard");
    return state.user;
  },
}));
vi.mock("@/lib/data/article-writes", () => writes);

const { approveArticle, rejectArticle } = await vi.importActual<typeof Actions>("../lib/articles/review-actions");
const { updateTag } = await import("next/cache");

const DEWI: User = { id: 1, name: "Dewi Lestari", email: "dewi.admin@herald.test", role: "admin", isActive: true, bio: "", beat: "" };
const RAFI: User = { ...DEWI, id: 2, name: "Rafi Pratama", email: "rafi@herald.test", role: "author" };
const NOTE = "Please confirm the vote counts.";

beforeEach(() => {
  state.user = DEWI;
  writes.reviewArticle.mockClear();
  vi.mocked(updateTag).mockClear();
});

describe("approveArticle and rejectArticle", () => {
  test("only the administrator decides", async () => {
    state.user = null;
    await expect(approveArticle(20)).rejects.toThrow("REDIRECT /login");
    await expect(rejectArticle(20, NOTE)).rejects.toThrow("REDIRECT /login");
    state.user = RAFI;
    await expect(approveArticle(20)).rejects.toThrow("REDIRECT /dashboard");
    await expect(rejectArticle(20, "short")).rejects.toThrow("REDIRECT /dashboard");
    expect(writes.reviewArticle).not.toHaveBeenCalled();
  });

  test("approving publishes under the reviewer's id and expires the cache", async () => {
    expect(await approveArticle(20)).toEqual({ ok: true, status: "published" });
    expect(writes.reviewArticle).toHaveBeenCalledWith(1, 20, { approve: true });
    expect(updateTag).toHaveBeenCalledWith("articles");
  });

  test("sending back stores the trimmed note", async () => {
    expect(await rejectArticle(21, `  ${NOTE}  `)).toEqual({ ok: true, status: "rejected" });
    expect(writes.reviewArticle).toHaveBeenCalledWith(1, 21, { approve: false, note: NOTE });
  });

  test("a note that is too short, too long or not text is refused without writing", async () => {
    for (const note of ["", "fix it", "a".repeat(2001), 42, null]) {
      const result = await rejectArticle(21, note as string);
      expect(result).toMatchObject({ ok: false, error: "note" });
    }
    expect(writes.reviewArticle).not.toHaveBeenCalled();
  });

  test("an id that is not a valid id is refused without writing", async () => {
    for (const id of ["20", 0, -1, 1.5, 2 ** 31, null]) {
      expect(await approveArticle(id as number)).toMatchObject({ ok: false, error: "gone" });
    }
    expect(writes.reviewArticle).not.toHaveBeenCalled();
  });

  test("an article that is not waiting for review gets one answer, and nothing expires", async () => {
    writes.reviewArticle.mockResolvedValueOnce(null);
    expect(await approveArticle(1)).toMatchObject({ ok: false, error: "gone" });
    expect(updateTag).not.toHaveBeenCalled();
  });

  test("a database error stays on the server", async () => {
    writes.reviewArticle.mockRejectedValueOnce(new Error("connection reset by 10.0.0.5"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await approveArticle(20);
    expect(result).toEqual({ ok: false, error: "failed", message: "Could not save the decision. Try again." });
    log.mockRestore();
  });
});
