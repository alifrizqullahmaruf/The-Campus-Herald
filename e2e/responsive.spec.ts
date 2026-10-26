import { expect, test, type Locator, type Page } from "@playwright/test";
import { axeViolations } from "./axe";
import {
  findClippedHeadings,
  findHorizontalOverflow,
  findSmallText,
  formatOffenders,
  listSmallTapTargets,
  measureAuthorCards,
  measureHeaderRow,
} from "./layout";
import { DASHBOARD_PAGES, NOT_FOUND_PAGES, PUBLIC_PAGES } from "./pages";

// Layout at every size project: phone-320, phone (375), tablet (768),
// laptop (1024), desktop (1280) and wide (1440). See playwright.config.ts and
// docs/plans/2026-10-22-responsif.md.
//
// Every test checks the correct layout. A bug that can't be fixed right away:
// skip it only where it shows, e.g. test.fixme(project() === "phone-320", "R-…: bug"),
// and note it in the plan.

const ROUTES = [...PUBLIC_PAGES, ...NOT_FOUND_PAGES, ...DASHBOARD_PAGES];

const project = () => test.info().project.name;
const width = (page: Page) => page.viewportSize()?.width ?? 0;

/** The element's box, after asserting it is visible (a changed page fails here, loudly). */
async function boxOf(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, "element has a layout box").not.toBeNull();
  return box as NonNullable<typeof box>;
}

for (const path of ROUTES) {
  test(`${path} has no horizontal overflow`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const report = await findHorizontalOverflow(page);
    expect(report.reachedBottom, `the scan stopped after ${report.steps} step(s) before the bottom of the page`).toBe(true);
    expect(report.offenders.length, `elements past the screen edge on ${path}:\n${formatOffenders(report.offenders, report.clientWidth)}`).toBe(0);
    expect(report.docOverflow, `the page scrolls ${report.docOverflow}px sideways`).toBeLessThanOrEqual(1);
  });

  test(`${path} headings are not clipped`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    const found = await findClippedHeadings(page);
    expect(found.map((x) => `${x.level} "${x.text}": ${x.problem}`)).toEqual([]);
  });

  test(`${path} has no WCAG 2.1 AA violations at 320px`, async ({ page }) => {
    test.skip(project() !== "phone-320", "axe at the smallest width only; smoke.spec.ts covers 1280px");
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await axeViolations(page)).toEqual([]);
  });

  // Report only, by decision in the plan (Tahap 1 note): targets under 44×44 px
  // are listed as an annotation for the Tahap 2/3 fixes and never fail the test.
  test(`${path} tap targets at 320px (report only)`, async ({ page }) => {
    test.skip(project() !== "phone-320", "tap targets are listed at 320px only");
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const small = await listSmallTapTargets(page);
    test.info().annotations.push({ type: "tap-targets<44", description: small.join("; ") || "none" });
  });
}

test.describe("public pages", () => {
  test("the header search icon opens the quick search palette on phones", async ({ page }) => {
    test.skip(width(page) >= 768, "the header has a search field from md up");
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    const banner = page.getByRole("banner");
    const icon = banner.getByRole("link", { name: "Search" }).or(banner.getByRole("button", { name: "Search", exact: true }));
    await expect(icon).toBeVisible();
    await icon.click();
    const palette = page.getByRole("dialog", { name: "Quick search" });
    await expect(palette).toBeVisible();
  });

  test("the phone menu fits the screen", async ({ page }) => {
    test.skip(width(page) >= 768, "the menu button only shows below md");
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    const sizes = await menu.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);
  });

  for (const target of [800, 1100]) {
    test(`the phone menu does not lock the page after widening to ${target}px`, async ({ page }) => {
      test.skip(width(page) >= 768, "the menu button only shows below md");
      await page.goto("/about");
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
      // Rotating a tablet or widening a window.
      await page.setViewportSize({ width: target, height: 900 });
      const state = () =>
        page.evaluate(() => ({
          bodyOverflow: getComputedStyle(document.body).overflow,
          invisibleModals: [...document.querySelectorAll('[aria-modal="true"]')].filter((d) => d.getBoundingClientRect().width === 0).length,
        }));
      await expect.poll(state).toEqual({ bodyOverflow: "visible", invisibleModals: 0 });
      // A real wheel scroll moves the page (programmatic scrolling would ignore overflow: hidden).
      await page.mouse.move(target / 2, 450);
      await page.mouse.wheel(0, 400);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    });
  }

  test.describe("at rest (reduced motion)", () => {
    test.use({ reducedMotion: "reduce" });

    test("hero cards rest inside the page column", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("main [data-physics]").first()).toHaveAttribute("data-physics", "static");
      const column = await boxOf(page.locator("main h1").locator('xpath=ancestor::div[contains(@class, "max-w-[1120px]")][1]'));
      const cards = page.locator("main [data-physics] [data-body]");
      expect(await cards.count(), "hero pile items").toBeGreaterThan(0);
      const outside = await cards.evaluateAll(
        (els, c) =>
          els
            .map((el) => el.getBoundingClientRect())
            .filter((b) => b.width > 0)
            .filter((b) => b.left < c.x - 1 || b.right > c.x + c.width + 1)
            .map((b) => `${Math.round(b.left)}..${Math.round(b.right)}`),
        column,
      );
      const message = `cards outside the column ${Math.round(column.x)}..${Math.round(column.x + column.width)}: ${outside.join(", ")}`;
      expect(outside, message).toEqual([]);
    });

    test("footer pills rest on screen and clear of the 'Drag the links' note", async ({ page }) => {
      await page.goto("/about");
      const footer = page.getByRole("navigation", { name: "Footer" });
      await footer.scrollIntoViewIfNeeded();
      await expect(footer.locator("[data-physics]")).toHaveAttribute("data-physics", "static");
      const note = await boxOf(footer.getByText("Drag the links"));
      const pills = footer.locator("[data-body]");
      await expect(pills).toHaveCount(5);
      const result = await pills.evaluateAll((els, note) => {
        const cw = document.documentElement.clientWidth;
        const boxes = els.map((el) => ({ text: el.textContent ?? "", box: el.getBoundingClientRect() }));
        // Bounding boxes of tilted pills: allow 2px where only their corners meet.
        const overlap = (a: DOMRect, b: DOMRect) =>
          Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
        return {
          overlapping: boxes.flatMap((a, i) => boxes.slice(i + 1).filter((b) => overlap(a.box, b.box)).map((b) => `${a.text}+${b.text}`)),
          offScreen: boxes.filter(({ box }) => box.left < -1 || box.right > cw + 1).map((p) => p.text),
          overNote: boxes
            .filter(({ box }) => Math.min(box.right, note.x + note.width) > Math.max(box.left, note.x) && Math.min(box.bottom, note.y + note.height) > Math.max(box.top, note.y))
            .map((p) => p.text),
        };
      }, note);
      expect(result).toEqual({ overlapping: [], offScreen: [], overNote: [] });
    });
  });

  test("the tilting hero does not slide over the next section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const section = page.locator("section").filter({ has: page.locator(".hero-tilt") });
    const { height } = await boxOf(section);
    const worst: number[] = [];
    for (const share of [0.3, 0.6, 0.9]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(height * share));
      // The tilt is a scroll-driven animation; give it two frames to follow the scroll.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      worst.push(
        await section.evaluate((el) => {
          const tilt = el.querySelector(".hero-tilt");
          return tilt ? Math.round(tilt.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom) : NaN;
        }),
      );
    }
    expect(worst.every(Number.isFinite), "found .hero-tilt inside the hero section").toBe(true);
    const message = `px past the hero's bottom at 30/60/90% scrolled: ${worst.join(", ")}`;
    expect(Math.max(...worst), message).toBeLessThanOrEqual(1);
  });

  test("header and footer line up with the page column", async ({ page }) => {
    await page.goto("/authors");
    const inner = (locator: Locator) =>
      locator.evaluate((el) => Math.round(el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft)));
    const content = page.locator('main [class*="max-w-[1120px]"]').first();
    const header = page.locator("header > div").first();
    const footer = page.locator("footer > div").first();
    for (const part of [content, header, footer]) await expect(part).toBeVisible();
    const lefts = { content: await inner(content), header: await inner(header), footer: await inner(footer) };
    expect(lefts).toEqual({ content: lefts.content, header: lefts.content, footer: lefts.content });
  });

  // AuthorCard is used on /authors and in the About teaser.
  for (const route of ["/authors", "/about"]) {
    test(`${route}: author names fit their pill and the bio fits the back of the card`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      const cards = await measureAuthorCards(page);
      expect(cards.error).toBeUndefined();
      expect(cards.cards, "author cards on the page").toBeGreaterThan(0);
      expect(cards.pills).toEqual([]);
      expect(cards.backs).toEqual([]);
    });
  }

  test("text is never smaller than 11px", async ({ page }) => {
    const found: string[] = [];
    for (const path of ["/", "/articles/the-new-grading-policy-explained-in-five-minutes", "/dashboard"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      for (const s of await findSmallText(page, 11)) found.push(`${path}: ${s.size} "${s.text}"`);
    }
    expect(found).toEqual([]);
  });

  test("a long URL in an article body wraps instead of widening the page", async ({ page }) => {
    await page.goto("/articles/the-new-grading-policy-explained-in-five-minutes");
    const prose = page.locator(".prose-herald").first();
    await expect(prose).toBeVisible();
    // Sample articles hold no long links yet; editor HTML from Phase 4 will. Add one the way the editor would.
    const result = await prose.evaluate((el) => {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = "https://example.com/";
      // No hyphens or slashes after the host: nothing a browser may break at by default.
      a.textContent = `https://example.com/${"longpathsegment".repeat(12)}`;
      p.append(a);
      el.append(p);
      const range = document.createRange();
      range.selectNodeContents(a);
      return { textRight: Math.round(range.getBoundingClientRect().right), columnRight: Math.round(el.getBoundingClientRect().right) };
    });
    expect(result.textRight).toBeLessThanOrEqual(result.columnRight + 1);
  });

  test("the About authors teaser uses three columns on tablets", async ({ page }) => {
    test.skip(width(page) < 768 || width(page) >= 1024, "tablet layout only");
    await page.goto("/about");
    const list = page.getByRole("heading", { name: "Meet the authors." }).locator("xpath=following::ul[1]");
    await expect(list).toBeVisible();
    const columns = await list.evaluate((ul) => getComputedStyle(ul).gridTemplateColumns.split(" ").length);
    expect(columns).toBeGreaterThanOrEqual(3);
  });

  test("the header never crowds or overflows between 768 and 1016px", async ({ page }) => {
    test.skip(project() !== "tablet", "sweeps the tablet range once");
    await page.goto("/about");
    await expect(page.getByRole("banner")).toBeVisible();
    for (let w = 768; w <= 1016; w += 8) {
      await page.setViewportSize({ width: w, height: 1024 });
      const state = await measureHeaderRow(page);
      expect(state, `at ${w}px`).toEqual({ error: undefined, overflow: 0, minGap: expect.any(Number), wrapped: false });
      expect(state.minGap, `gap between logo, nav and search at ${w}px`).toBeGreaterThanOrEqual(16);
    }
  });
});

test.describe("dashboard", () => {
  for (const [path, label] of [
    ["/dashboard/articles/22", "Submit for review"],
    ["/dashboard/review/21", "Approve"],
  ] as const) {
    test(`${path}: the action bar is not covered by the tab bar`, async ({ page }) => {
      test.skip(width(page) >= 1024, "the tab bar only shows below lg");
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const tabBox = await boxOf(page.getByRole("navigation", { name: "Dashboard" }).filter({ visible: true }));
      const button = page.getByRole("button", { name: label, exact: true });
      await expect(button).toBeVisible();
      const bar = button.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' fixed ')][1]");
      const barBox = await boxOf(bar);
      const overlap = Math.max(0, Math.round(barBox.y + barBox.height - tabBox.y));
      // Every button on the bar must be the topmost element at its centre and just above its bottom edge.
      const covered = await bar.evaluate((el) =>
        [...el.querySelectorAll("button")].flatMap((b) => {
          const r = b.getBoundingClientRect();
          return [r.top + r.height / 2, r.bottom - 3]
            .filter((y) => !b.contains(document.elementFromPoint(r.left + r.width / 2, y)))
            .map((y) => `${(b.textContent ?? "").trim()} at y=${Math.round(y)}`);
        }),
      );
      expect({ overlap, covered }).toEqual({ overlap: 0, covered: [] });
    });
  }

  test("tab bar labels stay on one line", async ({ page }) => {
    test.skip(width(page) >= 1024, "the tab bar only shows below lg");
    await page.goto("/dashboard");
    const links = page.getByRole("navigation", { name: "Dashboard" }).filter({ visible: true }).getByRole("link");
    await expect(links).toHaveCount(5);
    const lines = await links.evaluateAll((all) =>
      all.map((a) => {
        const label = a.querySelector("span");
        if (!label) return { text: a.textContent ?? "", lines: NaN };
        const style = getComputedStyle(label);
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
        return { text: label.textContent ?? "", lines: Math.round(label.getBoundingClientRect().height / lineHeight) };
      }),
    );
    expect(lines.every((l) => l.lines >= 1), `every tab has a label span: ${JSON.stringify(lines)}`).toBe(true);
    const wrapped = lines.filter((l) => l.lines > 1).map((l) => `${l.text}: ${l.lines} lines`);
    expect(wrapped).toEqual([]);
  });

  test("Log out is reachable on phones and tablets", async ({ page }) => {
    test.skip(width(page) >= 1024, "the sidebar shows Log out from lg up");
    await page.goto("/dashboard");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("link", { name: "Log out" }).or(page.getByRole("button", { name: "Log out" })).first()).toBeVisible();
  });

  test("the sidebar stays in view while scrolling", async ({ page }) => {
    test.skip(width(page) < 1024, "the sidebar shows from lg up");
    await page.goto("/dashboard/articles/22");
    await page.waitForLoadState("networkidle");
    const aside = page.locator("aside");
    await expect(aside).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => scrollY), { message: "the editor page scrolls" }).toBeGreaterThan(0);
    const top = await aside.evaluate((el) => Math.round(el.getBoundingClientRect().top));
    expect(top).toBeGreaterThanOrEqual(0);
  });

  test("All articles fits without scrolling sideways", async ({ page }) => {
    await page.goto("/dashboard/articles");
    const table = page.locator("table");
    await expect(table).toBeVisible();
    const sizes = await table.evaluate((t) => ({ scrollWidth: t.parentElement?.scrollWidth ?? NaN, clientWidth: t.parentElement?.clientWidth ?? NaN }));
    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);
  });

  test("review queue titles get most of the row", async ({ page }) => {
    await page.goto("/dashboard/review");
    const items = page.getByRole("main").getByRole("listitem");
    expect(await items.count(), "review queue items").toBeGreaterThan(0);
    const shares = await items.evaluateAll((all) =>
      all.map((li) => {
        const title = li.querySelector("a")?.parentElement?.getBoundingClientRect().width;
        if (title === undefined) return NaN;
        const inner = li.clientWidth - parseFloat(getComputedStyle(li).paddingLeft) - parseFloat(getComputedStyle(li).paddingRight);
        return Math.round((title / inner) * 100);
      }),
    );
    expect(shares.every(Number.isFinite), "every queue row has a title link").toBe(true);
    const message = `title width as % of the row: ${shares.join(", ")}`;
    expect(Math.min(...shares), message).toBeGreaterThanOrEqual(60);
  });

  test("the Add author dialog fits the screen", async ({ page }) => {
    await page.goto("/dashboard/authors");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Add author" }).click();
    const dialog = page.getByRole("dialog", { name: "Add an author." });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button").first()).toBeVisible();
    const fit = await dialog.evaluate((d) => {
      const box = d.getBoundingClientRect();
      const cw = document.documentElement.clientWidth;
      const outside = box.left < 0 || box.right > cw || box.top < 0 || box.bottom > innerHeight;
      return {
        dialog: outside ? `dialog ${Math.round(box.left)}..${Math.round(box.right)} x ${Math.round(box.top)}..${Math.round(box.bottom)}` : null,
        buttons: [...d.querySelectorAll("button")]
          .map((b) => ({ text: (b.textContent ?? "").trim(), r: b.getBoundingClientRect() }))
          .filter(({ r }) => r.left < box.left || r.right > box.right || r.left < 0 || r.right > cw)
          .map(({ text, r }) => `${text} ${Math.round(r.left)}..${Math.round(r.right)} (dialog ${Math.round(box.left)}..${Math.round(box.right)})`),
      };
    });
    expect(fit).toEqual({ dialog: null, buttons: [] });
  });

  test("the editor toolbar stays in view while writing", async ({ page }) => {
    await page.goto("/dashboard/articles/22");
    const toolbar = page.getByRole("toolbar", { name: "Formatting" });
    await expect(toolbar).toBeVisible();
    // Write a long article, so the editor is taller than the screen.
    const body = page.getByRole("textbox", { name: "Article" });
    await body.click();
    await page.keyboard.press("Control+End");
    for (let i = 0; i < 40; i++) await page.keyboard.press("Enter");
    const state = await toolbar.evaluate((el) => {
      const editor = el.parentElement;
      if (!editor) return { error: "the toolbar has no parent", editorTop: NaN, toolbarTop: NaN };
      // Scroll so the editor's top is 200px above the screen while its body still fills it.
      window.scrollTo({ top: editor.getBoundingClientRect().top + window.scrollY + 200, behavior: "instant" });
      return { error: undefined, editorTop: Math.round(editor.getBoundingClientRect().top), toolbarTop: Math.round(el.getBoundingClientRect().top) };
    });
    expect(state.error).toBeUndefined();
    expect(state.editorTop, "the editor scrolled past the top of the screen").toBeLessThan(0);
    expect(state.toolbarTop).toBeGreaterThanOrEqual(0);
  });

  test("editor toolbar buttons are 44px on touch screens", async ({ page }) => {
    test.skip(width(page) >= 768, "phones only");
    await page.goto("/dashboard/articles/22");
    const toolbar = page.getByRole("toolbar", { name: "Formatting" });
    await expect(toolbar).toBeVisible();
    const buttons = toolbar.getByRole("button");
    expect(await buttons.count(), "toolbar buttons").toBeGreaterThan(0);
    const small = await buttons.evaluateAll((all) =>
      all.map((b) => b.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`),
    );
    expect(small).toEqual([]);
  });

  test("below xl the editor reads title, category, cover, then the article", async ({ page }) => {
    test.skip(width(page) >= 1280, "from xl the category and cover sit in a side column");
    await page.goto("/dashboard/articles/22");
    await expect(page.getByRole("toolbar", { name: "Formatting" })).toBeVisible();
    const tops = await page.evaluate(() => {
      const top = (text: string) =>
        [...document.querySelectorAll("main label, main p")].find((el) => el.textContent?.trim() === text)?.getBoundingClientRect().top ?? null;
      return { title: top("Title"), category: top("Category"), cover: top("Cover image"), article: top("Article") };
    });
    expect(Object.values(tops).every((t) => t !== null), `found every field label: ${JSON.stringify(tops)}`).toBe(true);
    const { title, category, cover, article } = tops as Record<keyof typeof tops, number>;
    expect(title).toBeLessThan(category);
    expect(category).toBeLessThan(cover);
    expect(cover).toBeLessThan(article);
  });

  test("the review cover is sharp on large screens", async ({ page }) => {
    test.skip(width(page) < 1024, "the sizes hint only goes wrong from lg up");
    await page.goto("/dashboard/review/1");
    const img = page.getByRole("main").locator("img").first();
    // Bring it into view so a lazy image starts loading; a load that never ends fails here, not as the bug.
    await img.scrollIntoViewIfNeeded();
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { message: "the cover loads" }).toBe(true);
    const size = await img.evaluate((i: HTMLImageElement) => ({ natural: i.naturalWidth, shown: Math.round(i.getBoundingClientRect().width * devicePixelRatio) }));
    const message = `natural ${size.natural}px, shown at ${size.shown} device px`;
    expect(size.natural, message).toBeGreaterThanOrEqual(size.shown);
  });
});
