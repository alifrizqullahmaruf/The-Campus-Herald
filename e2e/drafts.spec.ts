import { expect, test } from "@playwright/test";
import { AUTHOR_STATE } from "./auth";
import { deleteTestArticles, uniqueTitle } from "./db";

// Saving a draft (Phase 4, day 2, docs/plans/2026-11-17-fase-4-alur-kerja.md). These
// tests write to the database, so they run in the desktop project only, and each deletes
// the rows it made (by its own unique title) when it ends, passed or failed. Fields are
// found by role: Next keeps the "New article" page in the document, hidden, after the
// first save, and a label lookup would find both.

let title = "";
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "writes to the database: one project only");
  title = uniqueTitle();
});
test.afterEach(async ({}, testInfo) => {
  if (testInfo.project.name === "desktop") await deleteTestArticles(title);
});

test.describe("as an author", () => {
  test.use({ storageState: AUTHOR_STATE });

  test("a new draft is saved, survives a reload and can be changed", async ({ page }) => {
    await page.goto("/dashboard/articles/new");
    await page.getByRole("textbox", { name: "Title" }).fill(title);
    await page.getByRole("textbox", { name: "Summary" }).fill("A summary written by the end-to-end test.");
    await page.getByRole("combobox", { name: "Category" }).selectOption("events");
    const body = page.getByRole("textbox", { name: "Article" });
    await body.click();
    await page.keyboard.type("The first paragraph.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("status")).toHaveText("Draft saved.");
    await expect(page).toHaveURL(/\/dashboard\/articles\/\d+$/);
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(title);

    await page.reload();
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(title);
    await expect(page.getByRole("textbox", { name: "Summary" })).toHaveValue("A summary written by the end-to-end test.");
    await expect(page.getByRole("combobox", { name: "Category" })).toHaveValue("events");
    await expect(page.getByRole("textbox", { name: "Article" })).toHaveText("The first paragraph.");

    // Saving again without a reload keeps what is on the screen (the editor is not mounted again).
    const changed = `${title} (changed)`;
    await page.getByRole("textbox", { name: "Title" }).fill(changed);
    await page.getByRole("textbox", { name: "Article" }).click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" More.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("status")).toHaveText("Draft saved.");
    await page.getByRole("textbox", { name: "Article" }).click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" Still here.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("status")).toHaveText("Draft saved.");
    await expect(page.getByRole("textbox", { name: "Article" })).toHaveText("The first paragraph. More. Still here.");
    const address = page.url();

    // "New article" starts empty again instead of holding the article just saved.
    await page.getByRole("link", { name: /New article/ }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "New article." })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue("");

    await page.goto(address);
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(changed);
    await expect(page.getByRole("textbox", { name: "Article" })).toHaveText("The first paragraph. More. Still here.");
    await expect(page.getByRole("status"), "the saved notice shows once").toHaveText("");

    await page.goto("/dashboard");
    await expect(page.getByRole("main").getByText(changed)).toBeVisible();
  });

  test("a draft needs a category before it is saved", async ({ page }) => {
    await page.goto("/dashboard/articles/new");
    await page.getByRole("textbox", { name: "Title" }).fill(title);
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Choose a category.")).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/articles\/new$/);
  });
});

test("the administrator sees someone else's draft read-only", async ({ page }) => {
  await page.goto("/dashboard/articles/19");
  await expect(page.getByText("Only the author can change this article.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
});
