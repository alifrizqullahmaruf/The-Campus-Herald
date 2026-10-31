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

// docs/plans/2026-10-29-cek-animasi.md (A, B): the headline was measured while
// still rising, so cards landed on its text; on phones and tablets the pile
// stacked up behind the sticky header.
for (const [width, height] of [
  [375, 812],
  [768, 1024],
  [1280, 800],
]) {
  test(`hero cards land clear of the headline and below the header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    // On a busy machine Matter.js can start after the 2.5 s fallback; the pile
    // then starts from its rest poses instead of dropping in, which this test is not about.
    await page.addInitScript(() => {
      new MutationObserver(() => {
        if (document.querySelector<HTMLElement>("[data-physics]")?.dataset.physics === "static")
          document.documentElement.dataset.heroWentStatic = "true";
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-physics"] });
    });
    await settledHero(page);
    test.skip(
      (await page.locator("html").getAttribute("data-hero-went-static")) === "true",
      "Matter.js started after the static fallback, so the cards did not drop in",
    );
    // Until the last card has stopped bouncing.
    await page.waitForTimeout(3000);
    const problems = await page.evaluate(() => {
      const pile = document.querySelector<HTMLElement>("[data-physics]")!;
      const box = pile.getBoundingClientRect();
      const headerBottom = document.querySelector("header")!.getBoundingClientRect().bottom;
      const obstacles = [...pile.querySelectorAll("[data-physics-obstacle]")].map((o) => o.getBoundingClientRect());
      const found: string[] = [];
      for (const el of pile.querySelectorAll<HTMLElement>("[data-body]")) {
        if (el.offsetWidth === 0) continue;
        const name = el.textContent!.trim().slice(0, 20);
        if (el.getBoundingClientRect().top < headerBottom - 10) found.push(`${name}: under the header`);
        // Points on the item's real (rotated) shape; transform-origin is its centre.
        const m = new DOMMatrix(getComputedStyle(el).transform);
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        let covered = 0;
        for (let sx = 0.1; sx < 1; sx += 0.2)
          for (let sy = 0.1; sy < 1; sy += 0.2) {
            if (el.dataset.body === "circle" && Math.hypot(sx - 0.5, sy - 0.5) > 0.5) continue;
            const p = m.transformPoint(new DOMPoint((sx - 0.5) * w, (sy - 0.5) * h));
            const x = box.left + w / 2 + p.x;
            const y = box.top + h / 2 + p.y;
            if (obstacles.some((o) => x > o.left + 2 && x < o.right - 2 && y > o.top + 2 && y < o.bottom - 2)) covered++;
          }
        if (covered > 0) found.push(`${name}: over the headline`);
      }
      return found;
    });
    expect(problems).toEqual([]);
  });
}

test("cards a wider window shows join the pile, and hidden ones leave it", async ({ page }) => {
  // Below lg the hero hides two cards (a half-screen window, a tablet turned sideways).
  await page.setViewportSize({ width: 960, height: 800 });
  await settledHero(page);
  // Every item, also the hidden ones and the decorative stickers (not in the accessibility tree).
  const items = page.locator('ul[aria-label="Latest notes"] > li');
  // Shown items must all be driven by the simulation (none left unpositioned in
  // the corner); hidden ones must not be (their bodies left the world).
  const state = () =>
    items.evaluateAll((els) => {
      const all = els.map((el) => ({ shown: (el as HTMLElement).offsetWidth > 0, driven: (el as HTMLElement).style.transform !== "" }));
      return {
        shown: all.filter((s) => s.shown).length,
        shownUndriven: all.filter((s) => s.shown && !s.driven).length,
        hiddenDriven: all.filter((s) => !s.shown && s.driven).length,
      };
    });
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(state).toEqual({ shown: 8, shownUndriven: 0, hiddenDriven: 0 });
  await page.setViewportSize({ width: 960, height: 800 });
  await expect.poll(state).toEqual({ shown: 6, shownUndriven: 0, hiddenDriven: 0 });
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

// docs/plans/2026-10-29-cek-animasi.md (C): with `contain`, a body shorter than
// the screen filled the bar within a few pixels at the end.
for (const [width, height] of [
  [375, 812],
  [1280, 800],
  [1440, 900],
]) {
  test(`the reading progress bar fills as the article body comes into view at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/articles/whats-on-the-desk-of-the-students-who-top-their-year");
    const { top, bottom } = await page.evaluate(() => {
      const body = document.querySelector('[class*="--article-body"]')!.getBoundingClientRect();
      return { top: body.top + scrollY, bottom: body.bottom + scrollY };
    });
    const bar = page.locator(".read-progress");
    const progress = () =>
      bar.evaluate((el) => {
        const scale = getComputedStyle(el).scale;
        return scale === "none" ? 1 : parseFloat(scale);
      });
    // Empty while the first line is below the screen, full once the last line is on it:
    // the share of the body that has come into view.
    const expected = (y: number) => Math.min(1, Math.max(0, (y - (top - height)) / (bottom - top)));
    for (const y of [Math.max(0, top - height - 10), (top + bottom) / 2 - height, bottom - height + 10]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      await expect.poll(progress).toBeCloseTo(expected(y), 1);
    }
  });
}

test("Most read thumbnails show the cover photos", async ({ page }) => {
  await page.goto("/");
  const thumbs = page.getByRole("heading", { name: "Most read." }).locator("xpath=following::ol[1]//img");
  await expect(thumbs).toHaveCount(5);
  await thumbs.first().scrollIntoViewIfNeeded();
  await expect.poll(() => thumbs.first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
});

// docs/plans/2026-10-29-animasi-most-read-authors.md: Most read rows rise into
// place, author cards settle from a pile.
/** Per element: its first animation's name and timeline, and whether it rests untransformed. */
const motionOf = (els: Element[]) =>
  els.map((el) => {
    const style = getComputedStyle(el);
    const zero = (value: string) => value === "none" || value.split(" ").every((part) => parseFloat(part) === 0);
    const animation = el.getAnimations()[0] as CSSAnimation | undefined;
    return {
      name: animation?.animationName ?? null,
      scrollLinked: animation ? !(animation.timeline instanceof DocumentTimeline) : null,
      atRest: zero(style.translate) && zero(style.rotate),
    };
  });

test("Most read rows rise into place as they scroll in", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator('section[aria-labelledby="most-read-title"] li');
  await expect(rows).toHaveCount(5);
  // Below the fold, the rows wait a little lower, on a scroll-linked animation
  // (polled: the view timeline can take a frame to resolve after load).
  await expect
    .poll(async () => {
      const before = await rows.evaluateAll(motionOf);
      return before.every((row) => row.name === "row-rise" && row.scrollLinked) && !before.at(-1)!.atRest;
    })
    .toBe(true);
  // Scrolled into the middle of the screen, every row has risen into place.
  await rows.last().evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight / 3, behavior: "instant" }));
  await expect.poll(async () => (await rows.evaluateAll(motionOf)).every((row) => row.atRest)).toBe(true);
});

test("the topic sidebar's Most read rises on load, and author cards settle on load", async ({ page }) => {
  for (const [path, selector, name] of [
    ["/categories/organisations", 'section[aria-labelledby="most-read-title"] li', "row-rise"],
    ["/authors", 'section[aria-label="Authors"] li', "pile-to-grid"],
  ]) {
    await page.goto(path);
    const items = page.locator(selector);
    // On screen when the page opens: a timed animation (still listed once it
    // has finished, as it fills both ways), not one waiting for a scroll.
    const start = await items.evaluateAll(motionOf);
    expect(start.length).toBeGreaterThan(0);
    expect(start.every((item) => item.name === name && item.scrollLinked === false)).toBe(true);
    await expect.poll(async () => (await items.evaluateAll(motionOf)).every((item) => item.atRest)).toBe(true);
  }
});

test("headlines use the subset display font at width 125%", async ({ page }) => {
  await page.goto("/authors");
  await page.evaluate(() => document.fonts.ready);
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCSS("font-stretch", "125%");
  // The cut-down Archivo (app/fonts/archivo-display.woff2) loaded, not just the fallback.
  const loaded = await page.evaluate(() => [...document.fonts].some((f) => /archivo/i.test(f.family) && f.status === "loaded" && f.stretch === "125%"));
  expect(loaded).toBe(true);
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

  test("Most read rows and author cards do not move", async ({ page }) => {
    for (const [path, selector] of [
      ["/", 'section[aria-labelledby="most-read-title"] li'],
      ["/categories/organisations", 'section[aria-labelledby="most-read-title"] li'],
      ["/authors", 'section[aria-label="Authors"] li'],
    ]) {
      await page.goto(path);
      const items = await page.locator(selector).evaluateAll(motionOf);
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((item) => item.name === null && item.atRest)).toBe(true);
    }
  });
});
