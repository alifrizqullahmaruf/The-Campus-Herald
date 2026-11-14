import { describe, expect, test } from "vitest";
import { isAdminPath } from "../lib/dashboard-paths";
describe("isAdminPath", () => {
  test.each(["/dashboard/review", "/dashboard/review/21", "/dashboard/authors", "/dashboard/articles"])(
    "%s belongs to the administrator",
    (path) => {
      expect(isAdminPath(path)).toBe(true);
    },
  );

  // Only the exact "All articles" list is an admin page; writing and editing are author pages.
  test.each(["/dashboard", "/dashboard/articles/new", "/dashboard/articles/22"])("%s is an author page", (path) => {
    expect(isAdminPath(path)).toBe(false);
  });
});
