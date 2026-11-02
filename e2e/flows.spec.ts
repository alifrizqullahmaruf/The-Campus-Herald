import { expect, test, type Page } from "@playwright/test";

/**
 * Presses Ctrl+K until quick search opens. The shortcut listener is attached in an
 * effect after hydration, and "networkidle" does not wait for that: on a busy machine
 * (full suite, server just started) it fires while the page is still hydrating, the
 * press is lost and the palette never opens (docs/plans/2026-11-02-persiapan-fase-2.md).
 * A key is pressed again only while the palette is not showing.
 */
async function openQuickSearch(page: Page) {
  const palette = page.getByRole("dialog", { name: "Quick search" });
  await expect(async () => {
    if (!(await palette.isVisible())) await page.keyboard.press("Control+K");
    await expect(palette).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  return palette;
}

test("Ctrl+K opens quick search; Enter opens the selected article", async ({ page }) => {
  await page.goto("/");
  let palette = await openQuickSearch(page);
  // Once the page is hydrated, a single press must open it: the retry above only
  // covers the wait for hydration, not a palette that opens on the second press.
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
  await page.keyboard.press("Control+K");
  palette = page.getByRole("dialog", { name: "Quick search" });
  await expect(palette).toBeVisible();
  const input = palette.getByRole("combobox", { name: "Search articles" });
  await expect(input).toBeFocused();
  await input.fill("coffee");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/articles\/the-coffee-queue/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("coffee queue");
});

for (const start of ["/about", "/search?q=coffee"]) {
  test(`"All results" in quick search opens the search page with the query and topic (from ${start})`, async ({ page }) => {
    await page.goto(start);
    const palette = await openQuickSearch(page);
    await palette.getByRole("combobox", { name: "Search articles" }).fill("music");
    await palette.getByRole("group", { name: "Filter by category" }).getByRole("button", { name: "Events" }).click();
    await palette.getByRole("link", { name: "All results →" }).click();
    await expect(palette).toBeHidden();
    await expect(page).toHaveURL(/\/search\?q=music&category=events$/);
    // Also when the search page was already open (it must not keep the old query).
    await expect(page.locator("#search-page-input")).toHaveValue("music");
    await expect(page.getByRole("button", { name: "Events", pressed: true })).toBeVisible();
  });
}

test(`"All results" resets the search page even when the URL matches how it was first opened`, async ({ page }) => {
  await page.goto("/search");
  await page.waitForLoadState("networkidle");
  // Typing updates the URL in place (history.replaceState), not through the server.
  await page.locator("#search-page-input").fill("music");
  await expect(page).toHaveURL(/\/search\?q=music$/);
  const palette = await openQuickSearch(page);
  await palette.getByRole("link", { name: "All results →" }).click();
  await expect(palette).toBeHidden();
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.locator("#search-page-input")).toHaveValue("");
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
  await page.getByRole("searchbox", { name: "Search articles" }).first().fill("piano");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=piano/);
  await expect(page.getByText(/1 of \d+ articles match “piano”/)).toBeVisible();
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
