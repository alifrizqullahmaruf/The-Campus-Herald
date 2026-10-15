import { expect, test } from "@playwright/test";
import { DASHBOARD_PAGES, PUBLIC_PAGES } from "./pages";

// Runs in the "phone" project (375px wide).
for (const path of [...PUBLIC_PAGES, ...DASHBOARD_PAGES]) {
  test(`${path} has no horizontal scroll at 375px`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("phone menu opens, navigates and closes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Authors" }).click();
  await expect(page).toHaveURL(/\/authors$/);
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
});

test("dashboard uses the bottom tab bar on phones", async ({ page }) => {
  await page.goto("/dashboard");
  const tabs = page.getByRole("navigation", { name: "Dashboard" }).filter({ visible: true });
  await expect(tabs).toHaveCount(1);
  await expect(tabs.getByRole("link", { name: /Review queue/ })).toBeVisible();
});
