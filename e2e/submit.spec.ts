import { expect, test } from "@playwright/test";
import { ADMIN_STATE, AUTHOR_STATE } from "./auth";
import { deleteTestArticles, insertPublishedArticle, statusOf, uniqueTitle } from "./db";

// Sending an article to the editor (Phase 4, day 3, docs/plans/2026-11-17-fase-4-alur-kerja.md).
// These tests write to the database: desktop project only, and each deletes its own rows
// (by a unique title) when it ends. Fields are found by role: Next keeps visited pages in
// the document, hidden, and a label lookup could find a hidden copy. The published row a
// test inserts can reach the cached public lists if a parallel test saves meanwhile; it is
// dated 2000 so it sorts last, and no other test looks for it. If a test fails before its
// submit, that cached copy stays until the next save expires the cache.

let title = "";
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "writes to the database: one project only");
  title = uniqueTitle();
});
test.afterEach(async ({}, testInfo) => {
  if (testInfo.project.name === "desktop") await deleteTestArticles(title);
});

test.use({ storageState: AUTHOR_STATE });

test("a new article is submitted, locked for the author and waiting in the review queue", async ({ page, browser }) => {
  await page.goto("/dashboard/articles/new");
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await page.getByRole("textbox", { name: "Summary" }).fill("Submitted by the end-to-end test.");
  await page.getByRole("combobox", { name: "Category" }).selectOption("events");
  await page.getByRole("textbox", { name: "Article" }).click();
  await page.keyboard.type("The first paragraph.");
  await page.getByRole("button", { name: "Submit for review" }).click();

  await expect(page).toHaveURL(/\/dashboard\/articles\/\d+$/);
  await expect(page.getByRole("status")).toHaveText("Sent to the editor for review.");
  await expect(page.getByText(/Waiting for the editor/)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Submit for review" })).toHaveCount(0);
  const id = Number(new URL(page.url()).pathname.split("/").pop());
  expect(await statusOf(id)).toBe("pending");

  const admin = await browser.newContext({ storageState: ADMIN_STATE });
  try {
    const queue = await admin.newPage();
    await queue.goto("/dashboard/review");
    await expect(queue.getByRole("main").getByRole("link", { name: title })).toBeVisible();
  } finally {
    await admin.close();
  }
});

test("a draft is submitted from its own page", async ({ page }) => {
  await page.goto("/dashboard/articles/new");
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await page.getByRole("combobox", { name: "Category" }).selectOption("opinion");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("Draft saved.");
  await expect(page).toHaveURL(/\/dashboard\/articles\/\d+$/);

  // Not complete yet: the summary and the body are missing.
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Write a short summary.")).toBeVisible();
  await page.getByRole("textbox", { name: "Summary" }).fill("Finished later by the end-to-end test.");
  await page.getByRole("textbox", { name: "Article" }).click();
  await page.keyboard.type("Now it has a body.");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByRole("status")).toHaveText("Sent to the editor for review.");
  await page.reload();
  await expect(page.getByText(/Waiting for the editor/)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Summary" })).toHaveValue("Finished later by the end-to-end test.");
});

test("a changed published article leaves the site until it is approved again", async ({ page }) => {
  const { id, slug } = await insertPublishedArticle(title);
  await page.goto(`/articles/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

  // Submitted straight away, without waiting for the page to settle: this is the case
  // where a prefetch of "View live" could store the public page after the submit.
  await page.goto(`/dashboard/articles/${id}`);
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await expect(page.getByText(/takes this article off the site/)).toBeVisible();
  await page.getByRole("textbox", { name: "Title" }).fill(`${title} (changed)`);
  await page.getByRole("button", { name: "Submit changes for review" }).click();
  await expect(page.getByRole("status")).toHaveText("Sent to the editor for review.");
  expect(await statusOf(id)).toBe("pending");

  // Same address (the slug stays), but the article is no longer public.
  await page.goto(`/articles/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page is not in the margins.");
});

test("an article without a body cannot be submitted", async ({ page }) => {
  await page.goto("/dashboard/articles/new");
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await page.getByRole("textbox", { name: "Summary" }).fill("No body yet.");
  await page.getByRole("combobox", { name: "Category" }).selectOption("events");
  await expect(page.getByRole("textbox", { name: "Article" })).toBeVisible();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Write the article before submitting it.")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/articles\/new$/);
});
