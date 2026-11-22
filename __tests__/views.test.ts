// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Counting reads (Phase 4 day 7, docs/plans/2026-11-17-fase-4-alur-kerja.md): the route with
// a fake write; the SQL is covered by e2e/views.spec.ts.
const writes = vi.hoisted(() => ({ countView: vi.fn<(id: number) => Promise<boolean>>(async () => true) }));
vi.mock("@/lib/data/view-writes", () => writes);

const { POST } = await import("../app/api/views/[id]/route");

function post(id: string, headers: Record<string, string> = {}) {
  const request = new NextRequest(`http://localhost:3200/api/views/${id}`, { method: "POST", headers });
  return POST(request, { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  writes.countView.mockClear();
  writes.countView.mockResolvedValue(true);
});

describe("POST /api/views/[id]", () => {
  test("the first read counts and leaves a cookie for this article only, for a day", async () => {
    const response = await post("7", { "sec-fetch-site": "same-origin" });
    expect(response.status).toBe(204);
    expect(writes.countView).toHaveBeenCalledWith(7);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^viewed=1;/);
    expect(cookie).toContain("Path=/api/views/7");
    expect(cookie).toContain("Max-Age=86400");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=strict/i);
  });

  test("a browser with the cookie is not counted again", async () => {
    const response = await post("7", { cookie: "viewed=1" });
    expect(response.status).toBe(204);
    expect(writes.countView).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("another site cannot count reads", async () => {
    for (const site of ["cross-site", "same-site", "none"]) {
      expect((await post("7", { "sec-fetch-site": site })).status, site).toBe(403);
    }
    expect(writes.countView).not.toHaveBeenCalled();
  });

  test("an id that is not a number in range is not found, without a query", async () => {
    for (const id of ["0", "-1", "1.5", "abc", "07", "2147483648", "99999999999"]) {
      expect((await post(id)).status, id).toBe(404);
    }
    expect(writes.countView).not.toHaveBeenCalled();
  });

  test("an article that is not published is not found and gets no cookie", async () => {
    writes.countView.mockResolvedValueOnce(false);
    const response = await post("19");
    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("a database error is not passed on", async () => {
    writes.countView.mockRejectedValueOnce(new Error("connection refused"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await post("7");
    expect(response.status).toBe(500);
    expect(await response.text()).toBe("");
    log.mockRestore();
  });
});
