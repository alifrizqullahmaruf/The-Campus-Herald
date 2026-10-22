import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/**
 * WCAG 2.1 AA violations on the current page, one line each
 * (`rule (impact): first targets`), so `expect(...).toEqual([])` shows them all.
 * Shared by smoke.spec.ts (1280px) and responsive.spec.ts (320px).
 */
export async function axeViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`,
  );
}
