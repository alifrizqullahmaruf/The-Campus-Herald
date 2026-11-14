import { expect, test, type Page } from "@playwright/test";
import { logIn, NO_SESSION } from "./auth";

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

// A behaviour check, not a regression test for the isOpen ref in command-palette-trigger:
// the native <dialog> already restores focus in Edge, so this passes with or without it.
test("a second Ctrl+K while quick search is open keeps where focus returns", async ({ page }) => {
  await page.goto("/categories");
  await page.waitForLoadState("networkidle");
  const chip = page.getByRole("button", { name: "Open quick search" });
  const palette = page.getByRole("dialog", { name: "Quick search" });
  // Hydration has finished once the shortcut works (see openQuickSearch).
  await openQuickSearch(page);
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
  await chip.click();
  await expect(palette).toBeVisible();
  // A second press must not make the palette's own input the place to return to.
  await page.keyboard.press("Control+K");
  await expect(palette).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
  await expect(chip).toBeFocused();
  // The same after a click on the backdrop, the other way to close it.
  await chip.click();
  await expect(palette).toBeVisible();
  await page.keyboard.press("Control+K");
  await expect(palette).toBeVisible();
  // The dialog has a margin, so this corner is always the backdrop.
  await page.mouse.click(5, 5);
  await expect(palette).toBeHidden();
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

test.describe("log in", () => {
  test.use({ storageState: NO_SESSION });
  const FAILED = "That email and password do not match an active account.";
  const sessionCookie = async (page: Page) =>
    (await page.context().cookies()).find((cookie) => cookie.name === "side_notes_session");

  test("an author lands on their articles, with an httpOnly session cookie", async ({ page }) => {
    await logIn(page, "rafi@herald.test");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1, name: "My articles." })).toBeVisible();
    expect(await sessionCookie(page)).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  });

  test("the editor lands on the review queue", async ({ page }) => {
    await logIn(page, "Dewi.Admin@herald.test");
    await expect(page).toHaveURL(/\/dashboard\/review$/);
  });

  // The same message for each, so the form does not tell which emails have an account.
  for (const [what, email, password] of [
    ["a wrong password", "rafi@herald.test", "not the password"],
    ["an unknown email", "nobody@herald.test", undefined],
    ["a deactivated account", "laras@herald.test", undefined],
  ] as const) {
    test(`${what} is refused and keeps the email`, async ({ page }) => {
      await logIn(page, email, password);
      await expect(page.getByRole("main").getByRole("alert")).toHaveText(FAILED);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByLabel("Email")).toHaveValue(email);
      await expect(page.getByLabel("Password")).toHaveValue("");
      await expect(page.getByLabel("Password")).toBeFocused();
      expect(await sessionCookie(page)).toBeUndefined();
    });
  }

  test("empty fields are caught before anything is sent", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Enter your email and password.");
  });

  test("works without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await logIn(page, "rafi@herald.test", "not the password");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(FAILED);
    await logIn(page, "rafi@herald.test");
    await expect(page).toHaveURL(/\/dashboard$/);
    expect(await sessionCookie(page)).toBeDefined();
    await context.close();
  });

  test("log out removes the session and opens the login page", async ({ page }) => {
    await logIn(page, "rafi@herald.test");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await sessionCookie(page)).toBeUndefined();
  });
});

// These read the database, which unit tests do not touch. A number too big for an integer
// column used to reach PostgreSQL and show the error page (docs/plans/2026-11-02-fase-2-database.md).
for (const path of ["/authors/99999999999", "/authors/1e21", "/authors/99", "/authors/1", "/authors/abc"]) {
  test(`${path} is the not-found page`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page is not in the margins.");
  });
}

test("a former member keeps their author page", async ({ page }) => {
  await page.goto("/authors/7");
  await expect(page.getByRole("heading", { level: 1, name: "Laras Wibowo" })).toBeVisible();
  await expect(page.getByText("Former member")).toBeVisible();
});
