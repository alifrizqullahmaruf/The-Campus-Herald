import { expect, test } from "@playwright/test";
import { isAdminPath } from "../lib/dashboard-paths";
import { AUTHOR_STATE, logIn, NO_SESSION } from "./auth";
import { DASHBOARD_PAGES } from "./pages";

// Who may open which dashboard page (Phase 3, docs/plans/2026-11-10-fase-3-login.md).
// The other specs run as the administrator (playwright.config.ts).

const ADMIN_PAGES = DASHBOARD_PAGES.filter(isAdminPath);
const AUTHOR_PAGES = DASHBOARD_PAGES.filter((path) => !isAdminPath(path));

test("the page list covers both kinds of dashboard page", () => {
  expect(ADMIN_PAGES.length).toBeGreaterThan(0);
  expect(AUTHOR_PAGES.length).toBeGreaterThan(0);
});

test.describe("without a login", () => {
  test.use({ storageState: NO_SESSION });

  for (const path of DASHBOARD_PAGES) {
    test(`${path} opens the login page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { level: 1, name: "Author log in." })).toBeVisible();
    });
  }

  test("a made-up session cookie opens the login page too, and is removed", async ({ page, context }) => {
    await context.addCookies([{ name: "side_notes_session", value: "2.9999999999.forged", url: "http://localhost:3200" }]);
    await page.goto("/dashboard/review");
    await expect(page).toHaveURL(/\/login$/);
    expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("side_notes_session");
  });

  test("the dashboard HTML holds no account data before the login", async ({ request }) => {
    // proxy.ts answers both with a real redirect, so even a visitor without JavaScript
    // never gets a dashboard page.
    const noCookie: Record<string, string> = {};
    for (const headers of [noCookie, { cookie: "side_notes_session=2.9999999999.forged" }]) {
      const response = await request.get("/dashboard/authors", { maxRedirects: 0, headers });
      expect(response.status()).toBe(307);
      expect(response.headers().location).toMatch(/\/login$/);
      expect(await response.text()).not.toContain("@herald.test");
    }
  });
});

test.describe("as an author", () => {
  test.use({ storageState: AUTHOR_STATE });

  for (const path of ADMIN_PAGES) {
    test(`${path} sends the author to their own articles`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("heading", { level: 1, name: "My articles." })).toBeVisible();
    });
  }

  test("the navigation shows the author and no editor pages", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.getByRole("complementary");
    await expect(sidebar.getByText("Rafi Pratama")).toBeVisible();
    await expect(page.getByRole("link", { name: /Review queue/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Authors/ })).toHaveCount(0);
  });

  test("their own article opens; someone else's is not found", async ({ page }) => {
    await page.goto("/dashboard/articles/19");
    await expect(page.getByRole("heading", { level: 1, name: "Edit article." })).toBeVisible();
    await page.goto("/dashboard/articles/22");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page is not in the margins.");
  });
});

test.describe("after logging out", () => {
  test.use({ storageState: NO_SESSION });

  test("the dashboard is closed again", async ({ page }) => {
    await logIn(page, "rafi@herald.test");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });
});
