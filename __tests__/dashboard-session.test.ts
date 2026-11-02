import { describe, expect, test } from "vitest";
import { isAdminPath } from "../lib/dashboard-paths";
import { getPreviewUser } from "../lib/data/session";

describe("getPreviewUser", () => {
  test("author pages preview as Rafi", async () => {
    const user = await getPreviewUser("author");
    expect(user).toMatchObject({ id: 2, name: "Rafi Pratama", role: "author" });
  });

  test("admin pages preview as Dewi", async () => {
    const user = await getPreviewUser("admin");
    expect(user).toMatchObject({ id: 1, name: "Dewi Lestari", role: "admin" });
  });
});

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
