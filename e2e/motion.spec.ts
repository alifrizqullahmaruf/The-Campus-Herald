import { expect, test, type Page } from "@playwright/test";

// Physics piles, draggable rows and avatars (docs/plans/2026-10-17-gambar-dan-animasi.md).

async function settledHero(page: Page) {
  await page.goto("/");
  const hero = page.locator("[data-physics]").first();
  await expect(hero).toHaveAttribute("data-physics", "running", { timeout: 10_000 });
  // Let the cards land.
  await page.waitForTimeout(3000);
  return hero;
}

test("hero cards drop in and a plain click opens the article", async ({ page }) => {
  await settledHero(page);
  const link = page.getByRole("list", { name: "Latest notes" }).getByRole("link").first();
  const title = (await link.textContent())!.trim();
  await link.click();
  await expect(page).toHaveURL(/\/articles\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
});

test("dragging a hero card moves it without opening it", async ({ page }) => {
  await settledHero(page);
  const card = page.getByRole("list", { name: "Latest notes" }).getByRole("listitem").first();
  const before = (await card.boundingBox())!;
  const x = before.x + before.width / 2;
  const y = before.y + before.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y - 80, { steps: 8 });
  await page.mouse.move(x + 160, y - 160, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/$/);
  const after = (await card.boundingBox())!;
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(20);
});

test("topic rows can be dragged without opening a topic", async ({ page }) => {
  await page.goto("/");
  const row = page.getByRole("group", { name: "Topics" }).locator("> div").first();
  await row.scrollIntoViewIfNeeded();
  const box = (await row.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 300, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 450, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(/\/$/);
});

test("footer pills fall onto the wordmark and still navigate", async ({ page }) => {
  await page.goto("/categories");
  const footer = page.getByRole("navigation", { name: "Footer" });
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator("[data-physics]")).toHaveAttribute("data-physics", "running", { timeout: 10_000 });
  await page.waitForTimeout(2500);
  await footer.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);
});

test("writer avatars are served as SVG", async ({ request }) => {
  const response = await request.get("/avatars/5");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("piles stay static and visible", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("[data-physics]").first();
    await expect(hero).toHaveAttribute("data-physics", "static");
    await expect(page.getByRole("list", { name: "Latest notes" }).getByRole("link").first()).toBeVisible();
  });
});
