import { expect, test } from "@playwright/test";

// Runs in the "phone-320" and "phone" (375px) projects.
//
// The per-route "no horizontal scroll" check moved to responsive.spec.ts, which
// runs in these projects too and uses e2e/layout.ts. The old check compared
// scrollWidth with window.innerWidth, which grows when mobile emulation zooms
// out a page that is too wide, so it could never fail; the new one compares
// with documentElement.clientWidth, checks every element and text box, and
// scrolls to the bottom in steps.

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
