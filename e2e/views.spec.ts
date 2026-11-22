import { expect, test } from "@playwright/test";
import { NO_SESSION } from "./auth";
import { deleteTestArticles, insertArticle, uniqueTitle, viewCountOf } from "./db";

// Counting reads (Phase 4 day 7, docs/plans/2026-11-17-fase-4-alur-kerja.md): once per browser
// per article a day. The counts are checked on an article inserted by the test (desktop
// project only, deleted afterwards); it is not in the cached lists, so its page is not
// opened and the endpoint is called directly.

let title = "";
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "writes to the database: one project only");
  title = uniqueTitle();
});
test.afterEach(async ({}, testInfo) => {
  if (testInfo.project.name === "desktop") await deleteTestArticles(title);
});
test.use({ storageState: NO_SESSION });

const SAME_ORIGIN = { "sec-fetch-site": "same-origin" };

test("a browser counts once; another browser counts again", async ({ request, playwright, baseURL }) => {
  const { id } = await insertArticle(title);
  expect((await request.post(`/api/views/${id}`, { headers: SAME_ORIGIN })).status()).toBe(204);
  expect(await viewCountOf(id)).toBe(1);
  // The same browser (its cookie) again.
  expect((await request.post(`/api/views/${id}`, { headers: SAME_ORIGIN })).status()).toBe(204);
  expect(await viewCountOf(id)).toBe(1);

  const other = await playwright.request.newContext({ baseURL });
  expect((await other.post(`/api/views/${id}`, { headers: SAME_ORIGIN })).status()).toBe(204);
  expect(await viewCountOf(id)).toBe(2);
  await other.dispose();
});

test("an article waiting for review is not counted", async ({ request }) => {
  const { id } = await insertArticle(title, "pending");
  expect((await request.post(`/api/views/${id}`)).status()).toBe(404);
  expect(await viewCountOf(id)).toBe(0);
});

test("another site cannot count reads, and unknown ids are not found", async ({ request }) => {
  const { id } = await insertArticle(title);
  expect((await request.post(`/api/views/${id}`, { headers: { "sec-fetch-site": "cross-site" } })).status()).toBe(403);
  expect(await viewCountOf(id)).toBe(0);
  for (const path of ["/api/views/0", "/api/views/abc", "/api/views/2147483648"]) {
    expect((await request.post(path)).status(), path).toBe(404);
  }
});

test("opening an article sends its read from the browser", async ({ page }) => {
  await page.goto("/");
  const href = await page.locator('a[href^="/articles/"]').first().getAttribute("href");
  const sent = page.waitForResponse((r) => /\/api\/views\/\d+$/.test(r.url()) && r.request().method() === "POST");
  await page.goto(href!);
  expect((await sent).status()).toBe(204);
});
