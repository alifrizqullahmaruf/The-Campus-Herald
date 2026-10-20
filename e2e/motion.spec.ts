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

test("a slow Matter.js download shows the static pile first, then still runs", async ({ page }) => {
  // Hold back the chunk that contains matter-js past the 2.5 s fallback.
  await page.route("**/_next/static/chunks/**", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (body.includes("matter-js")) await new Promise((r) => setTimeout(r, 3500));
    await route.fulfill({ response, body });
  });
  await page.goto("/");
  const hero = page.locator("[data-physics]").first();
  await expect(hero).toHaveAttribute("data-physics", "static", { timeout: 5000 });
  await expect(page.getByRole("list", { name: "Latest notes" }).getByRole("link").first()).toBeVisible();
  await expect(hero).toHaveAttribute("data-physics", "running", { timeout: 10_000 });
  // Started from the rest poses: the cards stay visible, nothing is lifted off screen.
  const first = (await page.getByRole("list", { name: "Latest notes" }).getByRole("listitem").first().boundingBox())!;
  const box = (await hero.boundingBox())!;
  expect(first.y).toBeGreaterThan(box.y - first.height / 2);
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
  // Hovering pauses the drift, so only the drag moves the row.
  await page.mouse.move(box.x + 300, y);
  await page.waitForTimeout(200);
  const offset = () =>
    row.evaluate((r) => {
      const track = r.firstElementChild as HTMLElement;
      return { x: parseFloat(track.style.translate) || 0, period: track.scrollWidth / 2 };
    });
  const before = await offset();
  await page.mouse.down();
  await page.mouse.move(box.x + 450, y, { steps: 10 });
  const during = await offset();
  await page.mouse.up();
  // The offset wraps every period, so compare modulo one period.
  const moved = (((during.x - before.x) % before.period) + before.period) % before.period;
  expect(moved).toBeGreaterThan(130);
  expect(moved).toBeLessThan(170);
  await page.waitForTimeout(200);
  await expect(page).toHaveURL(/\/$/);
});

test("dragging a card follows the pointer while the hero is tilted", async ({ page }) => {
  await settledHero(page);
  // Scroll the hero partly out, so the scroll-driven tilt is applied.
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(400);
  const tilt = await page.locator(".hero-tilt").evaluate((el) => parseFloat(getComputedStyle(el).rotate) || 0);
  expect(tilt).toBeGreaterThan(2);
  const items = page.getByRole("list", { name: "Latest notes" }).getByRole("listitem");
  // Pick a card whose centre is on screen and not covered by another card.
  let target = -1;
  for (let i = 0; i < (await items.count()); i++) {
    const b = await items.nth(i).boundingBox();
    if (!b) continue;
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    if (cy < 120 || cy > 600) continue;
    const onTop = await items.nth(i).evaluate((el, [x, y]) => el.contains(document.elementFromPoint(x, y)), [cx, cy]);
    if (onTop) {
      target = i;
      break;
    }
  }
  expect(target).toBeGreaterThanOrEqual(0);
  const card = items.nth(target);
  // Grab it only once it lies still, so the pressed point really is its centre.
  await expect(async () => {
    const one = (await card.boundingBox())!;
    await page.waitForTimeout(250);
    const two = (await card.boundingBox())!;
    expect(Math.hypot(two.x - one.x, two.y - one.y)).toBeLessThan(0.5);
  }).toPass({ timeout: 8000 });
  const b = (await card.boundingBox())!;
  const start = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  const end = { x: start.x + 40, y: start.y - 30 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.waitForTimeout(1200);
  const held = (await card.boundingBox())!;
  await page.mouse.up();
  // The grabbed point (the card's centre) hangs right under the pointer.
  expect(Math.hypot(held.x + held.width / 2 - end.x, held.y + held.height / 2 - end.y)).toBeLessThan(12);
});

test.describe("touch", () => {
  test.use({ hasTouch: true });

  /** A finger drag through the DevTools protocol (Playwright has no touch drag). */
  async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
    const cdp = await page.context().newCDPSession(page);
    const steps = 10;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
    for (let i = 1; i <= steps; i++) {
      const point = { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps };
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }

  test("after throwing a hero card, Enter still opens another card", async ({ page }) => {
    await settledHero(page);
    const links = page.getByRole("list", { name: "Latest notes" }).getByRole("link");
    const b = (await links.first().boundingBox())!;
    const from = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    await touchDrag(page, from, { x: from.x + 120, y: from.y - 120 });
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/$/);
    await links.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/articles\//);
  });

  test("after dragging a topic row, Enter still opens a topic", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole("group", { name: "Topics" });
    const row = group.locator("> div").first();
    await row.scrollIntoViewIfNeeded();
    const box = (await row.boundingBox())!;
    const y = box.y + box.height / 2;
    await touchDrag(page, { x: box.x + 300, y }, { x: box.x + 450, y });
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/$/);
    await group.getByRole("link").first().focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/categories\//);
  });
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

test("Most read thumbnails show the cover photos", async ({ page }) => {
  await page.goto("/");
  const thumbs = page.getByRole("heading", { name: "Most read." }).locator("xpath=following::ol[1]//img");
  await expect(thumbs).toHaveCount(5);
  await thumbs.first().scrollIntoViewIfNeeded();
  await expect.poll(() => thumbs.first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
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
    // A static pile is not draggable, so touch scrolls the page as usual.
    const card = page.getByRole("list", { name: "Latest notes" }).getByRole("listitem").first();
    await expect(card).toHaveCSS("touch-action", "auto");
    await expect(card).not.toHaveCSS("cursor", "grab");
  });
});
