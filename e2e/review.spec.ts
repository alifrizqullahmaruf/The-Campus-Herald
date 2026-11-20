import { expect, test } from "@playwright/test";
import { AUTHOR_STATE } from "./auth";
import { deleteTestArticles, insertArticle, reviewOf, uniqueTitle } from "./db";

// The administrator's review (Phase 4, day 4, docs/plans/2026-11-17-fase-4-alur-kerja.md).
// These tests write to the database: desktop project only, and each deletes its own rows
// (by a unique title) when it ends. The articles they review were public before (dated
// 2000), so approving one does not move the front page for the tests running alongside.
// Once a test has approved or sent back its row, the cached public lists (Opinion, Rafi's
// page, search) can hold it until the next save, even after the row is deleted here; no
// other test looks for these titles.

let title = "";
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "writes to the database: one project only");
  title = uniqueTitle();
});
test.afterEach(async ({}, testInfo) => {
  if (testInfo.project.name === "desktop") await deleteTestArticles(title);
});

test("approving publishes the article and takes it out of the queue", async ({ page }) => {
  const { id, slug } = await insertArticle(title, "pending");
  // Straight to its page: a row written here, not by the app, is not in the cached queue
  // until the next save expires the cache (the approval below does).
  await page.goto(`/dashboard/review/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Yes, publish" }).click();
  await expect(page.getByRole("status")).toHaveText("Approved and published.");

  const row = await reviewOf(id);
  expect(row).toMatchObject({ status: "published", review_note: null, reviewer_id: 1 });
  expect(row?.published_at?.getUTCFullYear(), "a changed article keeps its first publication date").toBe(2000);

  await page.getByRole("link", { name: "← Review queue" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Review queue." })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: title })).toHaveCount(0);

  await page.goto(`/articles/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
});

test("sending back needs a note, which the author then sees in the editor", async ({ page, browser }) => {
  const { id } = await insertArticle(title, "pending");
  const note = "Please add where the figures come from.";
  await page.goto(`/dashboard/review/${id}`);
  await page.getByRole("button", { name: "Send back" }).click();
  await page.getByRole("button", { name: "Send back" }).last().click();
  await expect(page.getByText(/Tell the author what to change/)).toBeVisible();
  await page.getByRole("textbox", { name: "Note for the author" }).fill(note);
  await page.getByRole("button", { name: "Send back" }).last().click();
  await expect(page.getByRole("status")).toHaveText("Sent back to the author with your note.");
  expect(await reviewOf(id)).toMatchObject({ status: "rejected", review_note: note, reviewer_id: 1 });

  const author = await browser.newContext({ storageState: AUTHOR_STATE });
  try {
    const editor = await author.newPage();
    await editor.goto(`/dashboard/articles/${id}`);
    await expect(editor.getByText("The editor sent this back")).toBeVisible();
    await expect(editor.getByText(note)).toBeVisible();
    await expect(editor.getByRole("button", { name: "Submit for review" })).toBeVisible();
  } finally {
    await author.close();
  }
});

test("an article that is no longer pending cannot be decided again", async ({ page }) => {
  const { id } = await insertArticle(title, "pending");
  await page.goto(`/dashboard/review/${id}`);
  await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
  // Someone else decides first (another tab, another administrator).
  await insertDecisionElsewhere(id);
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Yes, publish" }).click();
  await expect(page.getByRole("status")).toHaveText(/no longer waiting for review/);
  expect((await reviewOf(id))?.status).toBe("rejected");
});

test.describe("as an author", () => {
  test.use({ storageState: AUTHOR_STATE });

  test("the review pages stay closed", async ({ page }) => {
    const { id } = await insertArticle(title, "pending");
    await page.goto(`/dashboard/review/${id}`);
    await expect(page).toHaveURL(/\/dashboard$/);
    expect((await reviewOf(id))?.status).toBe("pending");
  });
});

/** Sends the article back directly in the database, as a second reviewer would. */
async function insertDecisionElsewhere(id: number) {
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    await sql`update articles set status = 'rejected', review_note = 'Decided in another tab.' where id = ${id}`;
  } finally {
    await sql.end();
  }
}
