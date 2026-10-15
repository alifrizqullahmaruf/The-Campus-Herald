import { describe, expect, test } from "vitest";
import { CATEGORIES, getCategoryById, getCategoryBySlug, isCategorySlug } from "../lib/categories";

describe("categories", () => {
  test("has the five fixed categories from the spec, in order", () => {
    expect(CATEGORIES.map((c) => c.name)).toEqual([
      "Academics",
      "Organisations",
      "Events",
      "Opinion",
      "Achievements",
    ]);
  });

  test("slugs and ids are unique", () => {
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(5);
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(5);
  });

  test("only Academics (blue) uses white text, for contrast", () => {
    const white = CATEGORIES.filter((c) => c.textClass === "text-white").map((c) => c.slug);
    expect(white).toEqual(["academics"]);
  });

  test("lookup helpers", () => {
    expect(getCategoryBySlug("opinion")?.name).toBe("Opinion");
    expect(getCategoryBySlug("sports")).toBeUndefined();
    expect(getCategoryById(5).slug).toBe("achievements");
    expect(() => getCategoryById(99)).toThrow();
    expect(isCategorySlug("events")).toBe(true);
    expect(isCategorySlug("Events")).toBe(false);
  });
});
