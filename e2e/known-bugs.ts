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

const TOPICS = ["/categories/academics", "/categories/organisations", "/categories/achievements"];

export const KNOWN_BUGS: Record<string, KnownBug> = {
  "R-HOME-FRESH": {
    symptom: "tilted 'Fresh off the notebook' cards (pile-card) stick out past both screen edges below 1024px",
    where: [{ check: "overflow", projects: [...PHONES, "tablet"], routes: ["/"], selector: "li.pile-card" }],
  },
  "R-CAT-H1": {
    symptom: "the topic title is one unbreakable word at 48px minimum: wider than the phone screen, and out of its column at 1280/1440",
    where: [
      { check: "overflow", projects: PHONES, routes: TOPICS, selector: "h1" },
      { check: "heading", projects: PHONES, routes: TOPICS, selector: "h1" },
      { check: "heading", projects: ["desktop", "wide"], routes: TOPICS.slice(1), selector: "h1" },
    ],
  },
  "R-AUTHOR-H1": {
    symptom: "'Yoga Firmansyah' h1 is 6px wider than the column at 320px",
    where: [{ check: "heading", projects: ["phone-320"], routes: ["/authors/6"], selector: "h1" }],
  },
  "R-TEXT-10PX": {
    symptom: "the text-[10px] class (logo byline, hero card badges and names, cover credits, ⌘K hint, Most read badges, dashboard tabs) is below the 11px minimum",
    where: [{ check: "small-text", projects: "all", selector: '[class~="text-[10px]"], [class~="text-[10px]!"]' }],
  },
  "R-SEARCH-ICON": {
    symptom: "the phone header search icon links to /search instead of opening the palette (docs/design.md 3, Header)",
    where: [{ check: "test", projects: PHONES }],
  },
  "R-MENU-320": {
    symptom: "'Categories' at text-5xl is 333px wide, so the phone menu scrolls sideways at 320px",
    where: [{ check: "test", projects: ["phone-320"] }],
  },
  "R-MENU-RESIZE": {
    symptom: "the open phone menu is hidden by CSS from md up but keeps body overflow hidden and aria-modal",
    where: [{ check: "test", projects: PHONES }],
  },
  "R-HERO-REST": {
    symptom: "hero rest poses are percent of the full width: cards are cut at the screen edge on phones/tablet and spread past the 1120px column on wide screens",
    where: [{ check: "test", projects: [...PHONES, "tablet", "desktop", "wide"] }],
  },
  "R-FOOTER-PILLS": {
    symptom: "footer rest poses cut a pill at the screen edge or cover the 'Drag the links' note on narrow screens",
    where: [{ check: "test", projects: [...PHONES, "tablet", "laptop"] }],
  },
  "R-HERO-TILT": {
    symptom: "rotating 6deg around the bottom-left corner pushes the hero's right side over the topics section",
    where: [{ check: "test", projects: ["tablet", "laptop", "desktop", "wide"] }],
  },
  "R-WIDE-ALIGN": {
    symptom: "header and footer are 1280px wide (max-w-7xl), the content column is 1120px",
    where: [{ check: "test", projects: ["desktop", "wide"] }],
  },
  "R-AUTHOR-PILL": {
    symptom: "'Yoga Firmansyah' spills out of its name pill at 320px",
    where: [{ check: "test", projects: ["phone-320"], routes: ["/authors"] }],
  },
  "R-AUTHOR-BIO": {
    symptom: "the bio and article count on the back of the author card run past the card on phones",
    where: [{ check: "test", projects: PHONES, routes: ["/authors", "/about"] }],
  },
  "R-PROSE-URL": {
    symptom: "prose-herald has overflow-wrap: normal, so an unbroken URL runs out of the column",
    where: [{ check: "test", projects: "all" }],
  },
  "R-ABOUT-TEASER": {
    symptom: "the About authors teaser stays at two columns from 768 to 1023px",
    where: [{ check: "test", projects: ["tablet"] }],
  },
  "R-DASH-BAR": {
    symptom: "the editor/review action bar sits at bottom-16 (64px) but the tab bar is 68px (83px when labels wrap)",
    where: [{ check: "test", projects: [...PHONES, "tablet"] }],
  },
  "R-TAB-LABELS": {
    symptom: "two-word tab labels wrap to two lines on phones, so the tab bar grows to 83px",
    where: [{ check: "test", projects: PHONES }],
  },
  "R-DASH-LOGOUT": {
    symptom: "below lg the dashboard has no visible Log out (only in the hidden sidebar)",
    where: [{ check: "test", projects: [...PHONES, "tablet"] }],
  },
  "R-SIDEBAR-STICKY": {
    symptom: "the dashboard sidebar scrolls away with the page",
    where: [{ check: "test", projects: ["laptop", "desktop", "wide"] }],
  },
  "R-TABLE": {
    symptom: "the All articles table has min-w-[720px], so it scrolls sideways below about 1060px",
    where: [{ check: "test", projects: [...PHONES, "tablet", "laptop"] }],
  },
  "R-QUEUE-TITLE": {
    symptom: "the number and 'Review →' squeeze review queue titles to about 80px at 320px and 136px at 375px",
    where: [{ check: "test", projects: PHONES }],
  },
  "R-DIALOG-320": {
    symptom: "the Add author dialog's button row is wider than the dialog at 320px",
    where: [{ check: "test", projects: ["phone-320"] }],
  },
  "R-EDITOR-TOOLBAR": {
    symptom: "the formatting toolbar is not sticky and scrolls away while writing",
    where: [{ check: "test", projects: "all" }],
  },
  "R-EDITOR-TOOLBAR-44": {
    symptom: "formatting toolbar buttons are 36px on touch screens",
    where: [{ check: "test", projects: PHONES }],
  },
  "R-EDITOR-ORDER": {
    symptom: "category and cover come after the article body below 1280px",
    where: [{ check: "test", projects: [...PHONES, "tablet", "laptop"] }],
  },
  "R-REVIEW-COVER": {
    symptom: "ArticleCover's default sizes asks for 360px, the review cover is shown up to 768px wide (blurry)",
    where: [{ check: "test", projects: ["laptop", "desktop", "wide"] }],
  },
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
