// Every route in the Phase 1 preview, used by the smoke, accessibility and phone checks.
export const PUBLIC_PAGES = [
  "/",
  "/categories",
  "/categories/academics",
  // The longest topic names: the widest titles on a phone.
  "/categories/organisations",
  "/categories/achievements",
  "/articles/the-new-grading-policy-explained-in-five-minutes",
  "/search",
  "/search?q=music",
  "/authors",
  "/authors/5",
  // Longest writer name ("Yoga Firmansyah").
  "/authors/6",
  "/about",
  "/login",
];

// Unknown routes stream the styled 404: the root one, and one inside the public layout.
export const NOT_FOUND_PAGES = ["/this-does-not-exist", "/articles/no-such-article"];

export const DASHBOARD_PAGES = [
  "/dashboard",
  "/dashboard/articles/new",
  "/dashboard/articles/22",
  "/dashboard/review",
  "/dashboard/review/21",
  "/dashboard/articles",
  "/dashboard/authors",
];
