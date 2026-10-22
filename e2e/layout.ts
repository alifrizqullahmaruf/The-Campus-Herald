import type { Page } from "@playwright/test";

// Layout measurements shared by responsive.spec.ts (docs/plans/2026-10-22-responsif.md, Tahap 1).
//
// Widths are measured against document.documentElement.clientWidth, the layout
// viewport. window.innerWidth is not used: with mobile emulation Chromium zooms
// out a page that is too wide, so innerWidth grows with the overflow and hides it.
//
// Functions passed to page.evaluate run in the browser, so they cannot use
// imports or helpers from this file; each one is self-contained. They avoid `!`
// on DOM lookups: a missing element becomes an `error` string that the caller
// asserts on, so a changed page fails loudly instead of throwing a TypeError.

/** [known bug id, CSS selector]: elements matching (or inside) the selector are tagged with the id. */
export type BugSelectors = [id: string, selector: string][];

export interface Offender {
  /** Short CSS-like path, e.g. `h1.font-display > #text`. */
  what: string;
  text: string;
  left: number;
  right: number;
  /** Page scroll position when it was seen. */
  scrollY: number;
  /** Ids of the known bugs whose selector matches this element. Empty: a new problem. */
  bugs: string[];
}

export interface OverflowReport {
  clientWidth: number;
  /** documentElement.scrollWidth - clientWidth, the largest seen while scrolling. */
  docOverflow: number;
  offenders: Offender[];
  /** Whether the scan saw the bottom of the page (scrollY + innerHeight >= scrollHeight - 1). */
  reachedBottom: boolean;
  steps: number;
}

/**
 * One pass at the current scroll position: every rendered element and text node
 * whose box reaches past the viewport's left or right edge (1 px tolerance),
 * after cutting it down to each ancestor that really clips it. <html> and <body>
 * do not count as clipping ancestors: being cut off at the screen edge is exactly
 * the bug we are looking for.
 */
function scanOverflow(known: BugSelectors) {
  const root = document.documentElement;
  const cw = root.clientWidth;
  const styles = new Map<Element, CSSStyleDeclaration>();
  const css = (el: Element) => {
    let s = styles.get(el);
    if (!s) styles.set(el, (s = getComputedStyle(el)));
    return s;
  };
  const clips = (s: CSSStyleDeclaration) => s.overflowX !== "visible" || /paint|strict|content/.test(s.contain);
  // Ancestors that become the containing block of a position: fixed descendant.
  const holdsFixed = (s: CSSStyleDeclaration) =>
    s.transform !== "none" ||
    s.filter !== "none" ||
    s.perspective !== "none" ||
    s.backdropFilter !== "none" ||
    /paint|layout|strict|content/.test(s.contain) ||
    /transform|filter|perspective/.test(s.willChange);
  // ...and of a position: absolute descendant.
  const holdsAbsolute = (s: CSSStyleDeclaration) => s.position !== "static" || holdsFixed(s);

  /**
   * The horizontal span that is actually painted. An overflow ancestor only clips
   * a descendant whose containing-block chain passes through it: an absolute
   * element skips ancestors up to its nearest positioned one, a fixed element
   * skips everything except transformed/filtered/contained ancestors.
   */
  const visibleSpan = (start: Element, left: number, right: number) => {
    const cut = (el: Element) => {
      const box = el.getBoundingClientRect();
      left = Math.max(left, box.left);
      right = Math.min(right, box.right);
    };
    // The start element clips its own text nodes (it is their containing block).
    if (clips(css(start))) cut(start);
    let escaping = css(start).position;
    for (let el = start.parentElement; el && el !== document.body && el !== root; el = el.parentElement) {
      const s = css(el);
      const isContainingBlock = escaping === "fixed" ? holdsFixed(s) : escaping === "absolute" ? holdsAbsolute(s) : true;
      if (!isContainingBlock) continue;
      if (clips(s)) cut(el);
      if (right <= left) return null;
      escaping = s.position;
    }
    // A fixed element whose chain never met a containing block is positioned against the viewport.
    return { left, right };
  };

  const describe = (el: Element) => {
    const parts: string[] = [];
    for (let node: Element | null = el; node && node !== document.body && parts.length < 3; node = node.parentElement) {
      const cls = [...node.classList].filter((c) => !c.includes(":")).slice(0, 2);
      parts.unshift(node.tagName.toLowerCase() + (node.id ? `#${node.id}` : "") + (cls.length ? `.${cls.join(".")}` : ""));
    }
    return parts.join(" > ");
  };

  const bugsOf = (el: Element) => known.filter(([, selector]) => el.closest(selector)).map(([id]) => id);

  const offenders: Offender[] = [];
  const report = (el: Element, what: string, text: string, left: number, right: number) => {
    const span = visibleSpan(el, left, right);
    if (!span) return;
    if (span.right > cw + 1 || span.left < -1) {
      offenders.push({
        what,
        text: text.replace(/\s+/g, " ").trim().slice(0, 50),
        left: Math.round(span.left),
        right: Math.round(span.right),
        scrollY: Math.round(scrollY),
        bugs: bugsOf(el),
      });
    }
  };

  const hidden = (el: Element) => {
    const s = css(el);
    return s.display === "none" || s.visibility === "hidden" || s.display === "contents";
  };

  // The back of a flip card (AuthorCard: backface-visibility hidden, turned
  // rotateY(180deg)) is not painted until the card turns; responsive.spec.ts
  // checks it separately. Only a 3D half-turn around Y counts (m11 < 0 and
  // m33 < 0), not a 2D rotate(180deg) or a mirror, which are painted.
  const facingAway = (el: Element) => {
    for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
      const s = css(node);
      if (s.backfaceVisibility !== "hidden" || s.transform === "none") continue;
      const m = new DOMMatrix(s.transform);
      if (!m.is2D && m.m11 < 0 && m.m33 < 0) return true;
    }
    return false;
  };

  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("script,style,template,noscript") || hidden(el) || facingAway(el)) continue;
    const box = el.getBoundingClientRect();
    // Screen-reader-only content (1×1 px, clipped) is not painted.
    if (box.width <= 1 && box.height <= 1) continue;
    report(el, describe(el), el.textContent ?? "", box.left, box.right);
  }

  // Text that spills out of a box which itself fits (e.g. a long word in a flex heading).
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || !node.textContent?.trim() || parent.closest("script,style,template,noscript")) continue;
    if ((hidden(parent) && css(parent).display !== "contents") || facingAway(parent)) continue;
    range.selectNodeContents(node);
    const box = range.getBoundingClientRect();
    if (box.width === 0) continue;
    if (parent.getBoundingClientRect().width <= 1) continue;
    report(parent, `${describe(parent)} > #text`, node.textContent, box.left, box.right);
  }

  return { clientWidth: cw, docOverflow: root.scrollWidth - cw, offenders };
}

/**
 * Checks for horizontal overflow at the top of the page and then at every
 * three-quarter screen while scrolling down, until the bottom is reached
 * (scroll-driven effects such as the hero tilt and the "Fresh" pile only move
 * once scrolled). `known` tags offenders that belong to an open known bug.
 */
export async function findHorizontalOverflow(page: Page, known: BugSelectors = [], maxSteps = 400): Promise<OverflowReport> {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const seen = new Map<string, Offender>();
  let docOverflow = 0;
  let clientWidth = 0;
  let reachedBottom = false;
  let steps = 0;
  const past = (o: Offender) => Math.max(o.right - clientWidth, -o.left);
  for (; steps < maxSteps; steps++) {
    // Let scroll-driven animations and sticky elements catch up with the new position.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const pass = await page.evaluate(scanOverflow, known);
    clientWidth = pass.clientWidth;
    docOverflow = Math.max(docOverflow, pass.docOverflow);
    for (const o of pass.offenders) {
      const key = `${o.what}|${o.text}`;
      const old = seen.get(key);
      if (!old || past(o) > past(old)) seen.set(key, o);
    }
    const move = await page.evaluate(() => {
      const bottom = () => scrollY + innerHeight >= document.documentElement.scrollHeight - 1;
      if (bottom()) return "bottom";
      const before = scrollY;
      window.scrollTo({ top: before + Math.round(innerHeight * 0.75), behavior: "instant" });
      return scrollY === before ? "stuck" : "moved";
    });
    if (move === "bottom") {
      reachedBottom = true;
      break;
    }
    // The page refuses to scroll (e.g. body locked): report it as not reaching the bottom.
    if (move === "stuck") break;
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  return { clientWidth, docOverflow, offenders: [...seen.values()], reachedBottom, steps: steps + 1 };
}

/** One line per offender, the worst first, with selector, text and position. */
export function formatOffenders(offenders: Offender[], clientWidth: number, limit = 12): string {
  const past = (o: Offender) => Math.max(o.right - clientWidth, -o.left);
  const sorted = [...offenders].sort((a, b) => past(b) - past(a));
  const lines = sorted
    .slice(0, limit)
    .map((o) => `  ${o.what} "${o.text}" spans ${o.left}..${o.right} (viewport ${clientWidth}) at scrollY ${o.scrollY}${o.bugs.length ? ` [${o.bugs.join(", ")}]` : ""}`);
  const more = sorted.length > limit ? `\n  …and ${sorted.length - limit} more` : "";
  return `${offenders.length} element(s) past the edge:\n${lines.join("\n")}${more}`;
}

export interface ClippedHeading {
  level: string;
  text: string;
  problem: string;
  bugs: string[];
}

/**
 * h1–h3 whose text sticks out of the heading box, or is cut off by the heading
 * or an ancestor that clips. Screen-reader-only headings are skipped.
 *
 * Measures the heading's own text nodes only. Text inside a transformed or
 * rotated descendant (stickers such as the hero's tilted "margins") is skipped:
 * its rect is the rotated bounding box, which sticks out by design. Icons and
 * other element boxes are ignored too.
 */
export async function findClippedHeadings(page: Page, known: BugSelectors = []): Promise<ClippedHeading[]> {
  return page.evaluate((known) => {
    const found: ClippedHeading[] = [];
    const range = document.createRange();
    for (const h of document.querySelectorAll("h1, h2, h3")) {
      const box = h.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue;
      if (getComputedStyle(h).visibility === "hidden") continue;
      const rects: DOMRect[] = [];
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        // Skip text inside a rotated descendant (a sticker), but never the heading
        // itself: a turned heading must still be checked, not silently skipped.
        let turned = false;
        for (let el = node.parentElement; el && el !== h; el = el.parentElement) {
          const s = getComputedStyle(el);
          if (s.transform !== "none" || s.rotate !== "none") turned = true;
        }
        if (turned) continue;
        range.selectNodeContents(node);
        rects.push(...[...range.getClientRects()].filter((r) => r.width > 0));
      }
      if (rects.length === 0) continue;
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      const text = (h.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 50);
      const level = h.tagName.toLowerCase();
      const bugs = known.filter(([, selector]) => h.closest(selector)).map(([id]) => id);
      const span = `text spans ${Math.round(left)}..${Math.round(right)}`;
      if (right > box.right + 1 || left < box.left - 1) {
        found.push({ level, text, bugs, problem: `${span}, heading box ${Math.round(box.left)}..${Math.round(box.right)}` });
        continue;
      }
      for (let el: Element | null = h; el && el !== document.body; el = el.parentElement) {
        if (getComputedStyle(el).overflowX === "visible") continue;
        const clip = el.getBoundingClientRect();
        if (right > clip.right + 1 || left < clip.left - 1) {
          found.push({ level, text, bugs, problem: `${span}, cut by ${el.tagName.toLowerCase()} ${Math.round(clip.left)}..${Math.round(clip.right)}` });
          break;
        }
      }
    }
    return found;
  }, known);
}

export interface SmallText {
  size: string;
  text: string;
  bugs: string[];
}

/** Rendered elements with their own text whose font size is below `min` px. */
export async function findSmallText(page: Page, min: number, known: BugSelectors = []): Promise<SmallText[]> {
  return page.evaluate(
    ([min, known]) =>
      [...document.querySelectorAll("body *")]
        .filter((el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()))
        .filter((el) => el.getBoundingClientRect().width > 1 && parseFloat(getComputedStyle(el).fontSize) < min)
        .map((el) => ({
          size: getComputedStyle(el).fontSize,
          text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 24),
          bugs: known.filter(([, selector]) => el.closest(selector)).map(([id]) => id),
        })),
    [min, known] as const,
  );
}

export interface AuthorCardReport {
  error?: string;
  cards: number;
  /** "Name: n px past its pill" for names that spill out of the front pill. */
  pills: string[];
  /** "Name: back text … runs n px past the card" for the bio on the back. */
  backs: string[];
}

/**
 * AuthorCard (components/author/author-card.tsx): `a.group > div > [front, back]`.
 * The back is found by structure (second child of the flipping wrapper), not by
 * its transform, and measured even though it is turned away.
 */
export async function measureAuthorCards(page: Page): Promise<AuthorCardReport> {
  return page.evaluate(() => {
    const range = document.createRange();
    const out = { cards: 0, pills: [] as string[], backs: [] as string[], error: undefined as string | undefined };
    for (const card of document.querySelectorAll('main a[href^="/authors/"].group')) {
      const [front, back] = card.firstElementChild?.children ?? [];
      const pill = front?.lastElementChild;
      const name = pill?.firstChild;
      if (!back || !pill || !name) {
        out.error = `author card ${card.getAttribute("href")} no longer has front/back/pill`;
        break;
      }
      out.cards++;
      range.selectNodeContents(name);
      const text = range.getBoundingClientRect();
      const pillBox = pill.getBoundingClientRect();
      if (text.right > pillBox.right + 1) out.pills.push(`${name.textContent}: name ends ${Math.round(text.right - pillBox.right)}px past its pill`);
      // The back is turned 180°, so compare extents, not sides.
      const backBox = back.getBoundingClientRect();
      for (const p of back.querySelectorAll("p")) {
        range.selectNodeContents(p);
        for (const r of range.getClientRects()) {
          const past = Math.max(r.right - backBox.right, backBox.left - r.left, r.bottom - backBox.bottom);
          if (past > 1) {
            out.backs.push(`${name.textContent}: back text "${(p.textContent ?? "").slice(0, 20)}" runs ${Math.round(past)}px past the card`);
            break;
          }
        }
      }
    }
    return out;
  });
}

/** The header row at the current width: overflow, smallest gap between its parts, wrapped nav links. */
export async function measureHeaderRow(page: Page) {
  return page.evaluate(() => {
    const row = document.querySelector("header > div");
    if (!row) return { error: "no header > div", overflow: NaN, minGap: NaN, wrapped: true };
    const parts = [...row.children].map((el) => el.getBoundingClientRect()).filter((b) => b.width > 0);
    const gaps = parts.slice(1).map((b, i) => Math.round(b.left - parts[i].right));
    const links = [...document.querySelectorAll('header nav[aria-label="Main"] a')];
    return {
      error: links.length === 0 ? "no Main nav links in the header" : undefined,
      overflow: row.scrollWidth - row.clientWidth,
      minGap: Math.min(...gaps),
      wrapped: links.some((a) => a.getClientRects().length > 1),
    };
  });
}

/** Interactive elements smaller than 44×44 px (report only; see responsive.spec.ts). */
export async function listSmallTapTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const selector = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])';
    const found: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (box.width <= 1 || box.height <= 1 || style.visibility === "hidden" || el.closest("[inert], dialog:not([open])")) continue;
      if (box.width >= 44 && box.height >= 44) continue;
      const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || el.tagName).replace(/\s+/g, " ").trim().slice(0, 40);
      // Links inside running text are exempt from target-size rules; flag them.
      const inline = el.tagName === "A" && style.display === "inline" && /^(P|LI|SPAN)$/.test(el.parentElement?.tagName ?? "");
      found.push(`${el.tagName.toLowerCase()} "${name}" ${Math.round(box.width)}x${Math.round(box.height)}${inline ? " (inline)" : ""}`);
    }
    return [...new Set(found)];
  });
}
