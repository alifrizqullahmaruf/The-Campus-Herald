import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { DASHBOARD_PAGES, PUBLIC_PAGES } from "./pages";

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(`${msg.text()} @ ${msg.location().url}`));
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

for (const path of [...PUBLIC_PAGES, ...DASHBOARD_PAGES]) {
  test(`loads ${path} with one h1 and no console errors`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test(`${path} has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`,
    );
    expect(summary).toEqual([]);
  });
}

test("unknown pages show the styled 404", async ({ page }) => {
  await page.goto("/this-does-not-exist");
  await expect(page.getByRole("heading", { name: "This page is not on any desk." })).toBeVisible();
});

test("drafts and pending articles are not public", async ({ page }) => {
  await page.goto("/articles/in-defence-of-the-7-am-lecture");
  await expect(page.getByRole("heading", { name: "This page is not on any desk." })).toBeVisible();
});
