import { describe, expect, test } from "vitest";
import {
  getAdjacentArticles,
  getArticleBySlug,
  getArticlesByAuthor,
  getCategoryCounts,
  getMostRead,
  getPendingArticles,
  getPublishedArticles,
  searchArticles,
} from "../lib/data/articles";
import { getAuthorById, getAuthors } from "../lib/data/users";
import { MOCK_ARTICLES } from "../lib/mock/articles";

describe("public article queries", () => {
  test("only published articles are public, newest first", async () => {
    const list = await getPublishedArticles();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((a) => a.status === "published")).toBe(true);
    const dates = list.map((a) => a.publishedAt ?? "");
    expect(dates).toEqual([...dates].sort().reverse());
  });

  test("filters by category and paginates", async () => {
    const opinion = await getPublishedArticles({ category: "opinion" });
    expect(opinion.length).toBeGreaterThan(0);
    expect(opinion.every((a) => a.category.slug === "opinion")).toBe(true);

    const all = await getPublishedArticles();
    const page2 = await getPublishedArticles({ limit: 3, offset: 3 });
    expect(page2.map((a) => a.id)).toEqual(all.slice(3, 6).map((a) => a.id));
  });

  test("draft, pending and rejected articles cannot be opened by slug", async () => {
    const hidden = MOCK_ARTICLES.filter((a) => a.status !== "published");
    expect(hidden.length).toBeGreaterThan(0);
    for (const article of hidden) {
      expect(await getArticleBySlug(article.slug)).toBeNull();
    }
  });

  test("most read returns 5 by default, highest view count first", async () => {
    const list = await getMostRead();
    expect(list).toHaveLength(5);
    const views = list.map((a) => a.viewCount);
    expect(views).toEqual([...views].sort((a, b) => b - a));
  });

  test("search is case-insensitive and can be limited to a category", async () => {
    const results = await searchArticles("COFFEE");
    expect(results.map((a) => a.slug)).toContain(
      "the-coffee-queue-is-a-design-problem-not-a-patience-problem",
    );
    expect(await searchArticles("coffee", "academics")).toHaveLength(0);
    expect(await searchArticles("pending-only-text-that-does-not-exist")).toHaveLength(0);
  });

  test("search never returns unpublished articles", async () => {
    // "7 a.m. lecture" exists only as a pending article.
    expect(await searchArticles("7 a.m.")).toHaveLength(0);
  });

  test("category counts add up to the published total", async () => {
    const counts = await getCategoryCounts();
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    expect(total).toBe((await getPublishedArticles()).length);
  });

  test("adjacent articles", async () => {
    const [newest, second] = await getPublishedArticles({ limit: 2 });
    const { newer, older } = await getAdjacentArticles(newest.slug);
    expect(newer).toBeNull();
    expect(older?.id).toBe(second.id);
  });

  test("articles carry a reading time and a public author without email", async () => {
    const [article] = await getPublishedArticles({ limit: 1 });
    expect(article.readingMinutes).toBeGreaterThanOrEqual(1);
    expect(article.author).not.toHaveProperty("email");
  });
});

describe("dashboard queries", () => {
  test("an author sees all of their own articles in every status", async () => {
    const list = await getArticlesByAuthor(2);
    expect(list.every((a) => a.authorId === 2)).toBe(true);
    expect(new Set(list.map((a) => a.status))).toContain("draft");
    expect(await getArticlesByAuthor(2, "draft")).toHaveLength(1);
  });

  test("review queue holds pending articles, oldest first", async () => {
    const queue = await getPendingArticles();
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.every((a) => a.status === "pending")).toBe(true);
    const submitted = queue.map((a) => a.submittedAt ?? "");
    expect(submitted).toEqual([...submitted].sort());
  });

  test("rejected articles carry a review note", () => {
    const rejected = MOCK_ARTICLES.filter((a) => a.status === "rejected");
    expect(rejected.length).toBeGreaterThan(0);
    expect(rejected.every((a) => a.reviewNote)).toBe(true);
  });
});

describe("users", () => {
  test("public author list has only active authors", async () => {
    const authors = await getAuthors();
    expect(authors.map((a) => a.name)).not.toContain("Laras Wibowo");
    expect(authors.map((a) => a.name)).not.toContain("Dewi Lestari");
  });

  test("inactive authors stay reachable so old articles keep a byline", async () => {
    expect((await getAuthorById(7))?.name).toBe("Laras Wibowo");
    expect(await getAuthorById(1)).toBeNull();
  });
});
