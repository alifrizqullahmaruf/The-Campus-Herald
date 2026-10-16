import { expect, test } from "@playwright/test";

test("Ctrl+K opens quick search; Enter opens the selected article", async ({ page }) => {
  await page.goto("/");
  // The shortcut listener attaches on hydration; wait for it before pressing keys.
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+K");
  const input = page.getByRole("combobox", { name: "Search articles" });
  await expect(input).toBeFocused();
  await input.fill("canteen");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/articles\/the-canteen-queue/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("canteen queue");
});

test("Esc closes quick search and returns focus", async ({ page }) => {
  await page.goto("/categories");
  await page.waitForLoadState("networkidle");
  const chip = page.getByRole("button", { name: "Open quick search" });
  await chip.click();
  await expect(page.getByRole("dialog", { name: "Quick search" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Quick search" })).toBeHidden();
  await expect(chip).toBeFocused();
});

test("header search form works without the palette", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("searchbox", { name: "Search articles" }).first().fill("robot");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=robot/);
  await expect(page.getByText(/1 of \d+ articles match “robot”/)).toBeVisible();
});

test("search page filters by topic and keeps the URL in sync", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("button", { name: "Opinion", exact: true }).click();
  await expect(page).toHaveURL(/category=opinion/);
  await expect(page.getByText(/^3 of \d+ articles$/)).toBeVisible();
});

test("author card links to the author page", async ({ page }) => {
  await page.goto("/authors");
  await page.getByRole("link", { name: /Sekar Ayu/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Sekar Ayu" })).toBeVisible();
});

test("editor approves a pending article in two steps", async ({ page }) => {
  await page.goto("/dashboard/review");
  await page.getByRole("link", { name: "Sports day schedule and where to watch" }).click();
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Yes, publish" }).click();
  await expect(page.getByRole("status")).toContainText("Approved and published");
});

test("an empty article cannot be submitted", async ({ page }) => {
  await page.goto("/dashboard/articles/new");
  await expect(page.getByRole("textbox", { name: "Article" })).toBeVisible();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Give the article a title.")).toBeVisible();
  await expect(page.getByText("Write the article before submitting it.")).toBeVisible();
});

test("the editor accepts formatted text", async ({ page }) => {
  await page.goto("/dashboard/articles/new");
  await page.getByLabel("Title").fill("Library opens a quiet room");
  await page.getByLabel("Category").selectOption("academics");
  const body = page.getByRole("textbox", { name: "Article" });
  await body.click();
  await page.getByRole("button", { name: "Heading", exact: true }).click();
  await page.keyboard.type("Where it is");
  await expect(body.locator("h2")).toHaveText("Where it is");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByRole("status")).toContainText("Sent to the editor");
});

test("log in opens the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("rafi@herald.test");
  await page.getByLabel("Password").fill("preview");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1, name: "My articles." })).toBeVisible();
});
