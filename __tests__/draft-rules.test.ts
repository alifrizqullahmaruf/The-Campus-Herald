// @vitest-environment node
import { describe, expect, test } from "vitest";
import {
  MAX_BODY_LENGTH,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  slugify,
  validateDraft,
} from "../lib/articles/draft-rules";

// Phase 4, day 2 (docs/plans/2026-11-17-fase-4-alur-kerja.md).

const ok = { title: "Library opens late", summary: "Open until midnight.", categorySlug: "academics", body: "<p>x</p>" };

describe("validateDraft", () => {
  test("a draft needs only a topic; everything else may be empty", () => {
    expect(validateDraft(ok)).toEqual({});
    expect(validateDraft({ title: "", summary: "", categorySlug: "events", body: "" })).toEqual({});
    expect(validateDraft({ ...ok, categorySlug: "" })).toEqual({ category: "Choose a category." });
    expect(validateDraft({ ...ok, categorySlug: "sports" })).toEqual({ category: "Choose a category." });
  });

  test("nothing may be longer than it can be stored or shown", () => {
    expect(validateDraft({ ...ok, title: "a".repeat(MAX_TITLE_LENGTH) })).toEqual({});
    expect(validateDraft({ ...ok, title: "a".repeat(MAX_TITLE_LENGTH + 1) }).title).toMatch(/under 200/);
    expect(validateDraft({ ...ok, summary: "a".repeat(MAX_SUMMARY_LENGTH + 1) }).summary).toMatch(/under 300/);
    expect(validateDraft({ ...ok, body: "a".repeat(MAX_BODY_LENGTH + 1) }).body).toMatch(/too long/);
    // Spaces around the title do not count; they are trimmed before saving.
    expect(validateDraft({ ...ok, title: ` ${"a".repeat(MAX_TITLE_LENGTH)} ` })).toEqual({});
  });
});

describe("slugify", () => {
  test("lower-case letters and digits joined by hyphens", () => {
    expect(slugify("Library opens a quiet room")).toBe("library-opens-a-quiet-room");
    expect(slugify("  What's on the desk? (2026)  ")).toBe("what-s-on-the-desk-2026");
    expect(slugify("Café & crème brûlée")).toBe("cafe-creme-brulee");
  });

  test("nothing usable becomes untitled", () => {
    expect(slugify("")).toBe("untitled");
    expect(slugify("!!! ???")).toBe("untitled");
    expect(slugify("日本語")).toBe("untitled");
  });

  test("at most 200 characters, never ending in a hyphen", () => {
    const slug = slugify(`${"a".repeat(199)} b`);
    expect(slug.length).toBeLessThanOrEqual(200);
    expect(slug.endsWith("-")).toBe(false);
  });
});
