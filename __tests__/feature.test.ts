import { describe, expect, test } from "vitest";
import { getPublishedArticles, getViewCounts } from "../lib/data/articles";
import { pickFeature } from "../lib/feature";

const article = (id: number, viewCount: number) => ({ id, viewCount });

describe("pickFeature", () => {
  test("ranks the five newest by the hourly counts, not the counts in the list", () => {
    const latest = [article(1, 900), article(2, 100), article(3, 50), article(4, 10), article(5, 0), article(6, 5000)];
    expect(pickFeature(latest, { 1: 900, 2: 1200, 3: 50, 4: 10, 5: 0, 6: 5000 })?.id).toBe(2);
  });

  test("a tie goes to the newer article; a missing count falls back to the list", () => {
    expect(pickFeature([article(1, 10), article(2, 10)], {})?.id).toBe(1);
    expect(pickFeature([article(1, 10), article(2, 30)], { 1: 20 })?.id).toBe(2);
  });

  test("nothing published, no cover story", () => {
    expect(pickFeature([], {})).toBeUndefined();
  });
});

describe("getViewCounts", () => {
  test("has a count for every published article and nothing else", async () => {
    const published = await getPublishedArticles();
    const views = await getViewCounts();
    expect(Object.keys(views).map(Number).sort((a, b) => a - b)).toEqual(published.map((a) => a.id).sort((a, b) => a - b));
    for (const a of published) expect(views[a.id]).toBe(a.viewCount);
  });
});
