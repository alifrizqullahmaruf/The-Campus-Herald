import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ArticleCard } from "../components/article/article-card";
import { ArticleRow } from "../components/article/article-row";
import { FeatureCard } from "../components/article/feature-card";
import { MostRead } from "../components/article/most-read";
import { getArticleBySlug, getMostRead } from "../lib/data/articles";
import { formatDate, initials } from "../lib/format";

afterEach(cleanup);

const SLUG = "the-canteen-queue-is-a-design-problem-not-a-patience-problem";

describe("format helpers", () => {
  test("formatDate is stable regardless of the machine time zone", () => {
    expect(formatDate("2026-10-14T23:30:00.000Z")).toBe("Oct 14, 2026");
    expect(formatDate(null)).toBe("");
  });

  test("initials", () => {
    expect(initials("Sekar Ayu")).toBe("SA");
    expect(initials("Yoga Firmansyah Putra")).toBe("YF");
  });
});

describe("ArticleCard", () => {
  test("is one link to the article with category, author and date", async () => {
    const article = (await getArticleBySlug(SLUG))!;
    const { container } = render(<ArticleCard article={article} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(`/articles/${SLUG}`);
    expect(screen.getByRole("heading", { level: 3, name: article.title })).toBeDefined();
    expect(screen.getByText("Opinion")).toBeDefined();
    expect(screen.getByText("Sekar Ayu")).toBeDefined();
    expect(screen.getByText("Oct 11, 2026")).toBeDefined();
    expect((container.firstElementChild as HTMLElement).className).toContain("bg-cat-opinion");
  });

  test("uses generated art, hidden from screen readers, when there is no photo", async () => {
    const article = (await getArticleBySlug(SLUG))!;
    const { container } = render(<ArticleCard article={article} />);
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("FeatureCard", () => {
  test("shows the pull quote from the body and a read link", async () => {
    const article = (await getArticleBySlug(SLUG))!;
    render(<FeatureCard article={article} />);
    expect(screen.getByText(/Nobody ever fixed a bottleneck/)).toBeDefined();
    expect(screen.getByRole("link", { name: /Read the story/ }).getAttribute("href")).toBe(`/articles/${SLUG}`);
  });
});

describe("Most read", () => {
  test("lists five ranked articles in view-count order", async () => {
    render(await MostRead({}));
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    const expected = await getMostRead(5);
    items.forEach((item, i) => {
      expect(within(item).getByRole("link").textContent).toBe(expected[i].title);
    });
  });

  test("rank number is decorative", async () => {
    const [article] = await getMostRead(1);
    const { container } = render(<ArticleRow article={article} rank={1} showViews />);
    expect(container.querySelector("span[aria-hidden='true']")?.textContent).toBe("01");
    expect(screen.getByText(/3,320 reads/)).toBeDefined();
  });
});
