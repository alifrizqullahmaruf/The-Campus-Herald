import { expect, type Page } from "@playwright/test";

/**
 * Presses Ctrl+K until quick search opens. The shortcut listener is attached in an
 * effect after hydration, and "networkidle" does not wait for that: on a busy machine
 * (full suite, server just started) it fires while the page is still hydrating, the
 * press is lost and the palette never opens (docs/plans/2026-11-02-persiapan-fase-2.md).
 * A key is pressed again only while the palette is not showing.
 */
export async function openQuickSearch(page: Page) {
  const palette = page.getByRole("dialog", { name: "Quick search" });
  await expect(async () => {
    if (!(await palette.isVisible())) await page.keyboard.press("Control+K");
    await expect(palette).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  return palette;
}

/**
 * Waits until the public page is hydrated, by opening quick search once and closing it.
 * Use it before clicking a control that only works with JavaScript (the ⌘K chip, the
 * phone search icon): clicked earlier, the chip does nothing and the icon follows its
 * plain link to /search (docs/plans/2026-11-10-fase-3-login.md, day 6). This relies on the
 * header and the shortcut listener hydrating together: both sit in app/(public)/layout.tsx
 * with no <Suspense> between them. Wrapping either in its own boundary breaks the guarantee.
 */
export async function waitForHydration(page: Page) {
  const palette = await openQuickSearch(page);
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
}
