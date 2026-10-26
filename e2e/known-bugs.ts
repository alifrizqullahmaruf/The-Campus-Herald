import type { BugSelectors } from "./layout";

// Open layout bugs found in Tahap 1 of docs/plans/2026-10-22-responsif.md.
//
// One entry per bug, keyed by id. responsive.spec.ts reads this registry:
//
// - Per-route scans ("overflow", "heading", "small-text") filter out offenders
//   inside the entry's `selector` on the listed routes and projects, require that
//   at least one such offender is STILL there, and require every other offender
//   list to be empty. A new problem on the same page therefore still fails.
// - Interaction tests ("test") assert the bug's specific symptom where it is
//   open and the correct behaviour everywhere else.
//
// Either way a fixed bug turns its test red ("… no longer shows"): delete its
// entry here (and only here) to switch the test to the correct expectation.

export type Project = "phone-320" | "phone" | "tablet" | "laptop" | "desktop" | "wide";
export const PHONES: Project[] = ["phone-320", "phone"];

type Check = "overflow" | "heading" | "small-text" | "test";

interface Where {
  check: Check;
  projects: Project[] | "all";
  /** Routes where it shows; omitted: every route the check visits. */
  routes?: string[];
  /** Per-route scans: the elements this bug accounts for (matched with `closest`). */
  selector?: string;
}

interface KnownBug {
  symptom: string;
  where: Where[];
}

export const KNOWN_BUGS: Record<string, KnownBug> = {
};

const applies = (w: Where, check: Check, project: string, route?: string) =>
  w.check === check &&
  (w.projects === "all" || w.projects.includes(project as Project)) &&
  (!w.routes || route === undefined || w.routes.includes(route));

/** [id, selector] of the bugs a per-route scan must account for on this route and project. */
export function knownSelectors(check: Exclude<Check, "test">, project: string, route?: string): BugSelectors {
  const out: BugSelectors = [];
  for (const [id, bug] of Object.entries(KNOWN_BUGS)) {
    const selectors = bug.where.filter((w) => applies(w, check, project, route) && w.selector).map((w) => w.selector as string);
    if (selectors.length) out.push([id, [...new Set(selectors)].join(", ")]);
  }
  return out;
}

/**
 * Whether the interaction bug `id` is open on this project (and route). An id
 * with no entry (the bug was fixed and its entry deleted) is not open, so the
 * test then expects the correct behaviour.
 */
export function isOpen(id: string, project: string, route?: string): boolean {
  return KNOWN_BUGS[id]?.where.some((w) => applies(w, "test", project, route)) ?? false;
}

/** Assertion message for a bug-specific expectation. */
export function stillOpen(id: string): string {
  return `${id} (KNOWN_BUGS) expected its symptom here: "${KNOWN_BUGS[id]?.symptom}". If it was fixed, delete the entry in e2e/known-bugs.ts`;
}
