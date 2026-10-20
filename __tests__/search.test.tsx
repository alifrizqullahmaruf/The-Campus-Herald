import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { GET } from "../app/api/search/route";
import CommandPalette from "../components/search/command-palette";
import { SearchExplorer } from "../components/search/search-explorer";
import { getPublishedArticles } from "../lib/data/articles";
import { matchesQuery, type SearchResult } from "../lib/search";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeAll(() => {
  // jsdom has no <dialog> modal support.
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  push.mockReset();
});

describe("matchesQuery", () => {
  const article = { title: "Campus music night returns", excerpt: "Six student bands, one stage." };
  test("matches title or excerpt, case-insensitive, trims spaces", () => {
    expect(matchesQuery(article, "MUSIC")).toBe(true);
    expect(matchesQuery(article, "  bands ")).toBe(true);
    expect(matchesQuery(article, "exam")).toBe(false);
    expect(matchesQuery(article, "")).toBe(true);
  });
});

describe("GET /api/search", () => {
  test("returns compact results without the body", async () => {
    const response = await GET(new Request("http://test/api/search?q=canteen"));
    const { results } = (await response.json()) as { results: SearchResult[] };
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("the-canteen-queue-is-a-design-problem-not-a-patience-problem");
    expect(results[0]).not.toHaveProperty("body");
    // The palette thumbnail uses the article's cover photo.
    expect(results[0].coverImage).toMatch(/^https:/);
  });

  test("empty query returns the newest six; unknown category is ignored", async () => {
    const response = await GET(new Request("http://test/api/search?q=&category=sports"));
    const { results } = (await response.json()) as { results: SearchResult[] };
    expect(results).toHaveLength(6);
  });

  test("category filter", async () => {
    const response = await GET(new Request("http://test/api/search?q=the&category=events"));
    const { results } = (await response.json()) as { results: SearchResult[] };
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.categorySlug === "events")).toBe(true);
  });
});

describe("SearchExplorer", () => {
  test("fades non-matching cards and hides them from assistive tech", async () => {
    const articles = await getPublishedArticles();
    render(<SearchExplorer articles={articles} initialQuery="" initialCategory="" />);
    expect(screen.getByText(`${articles.length} of ${articles.length} articles`)).toBeDefined();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "canteen" } });
    expect(screen.getByText(/1 of \d+ articles match “canteen”/)).toBeDefined();
    // Only the matching card is exposed.
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(window.location.search).toBe("?q=canteen");
  });

  test("category filter is a toggle button", async () => {
    const articles = await getPublishedArticles();
    render(<SearchExplorer articles={articles} initialQuery="" initialCategory="opinion" />);
    const opinion = screen.getByRole("button", { name: "Opinion" });
    expect(opinion.getAttribute("aria-pressed")).toBe("true");
    const opinionCount = articles.filter((a) => a.category.slug === "opinion").length;
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(opinionCount);
    fireEvent.click(opinion);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(articles.length);
  });
});

describe("CommandPalette", () => {
  const results: SearchResult[] = [
    { id: 1, slug: "first", title: "First", categoryName: "Events", categorySlug: "events", authorName: "A", readingMinutes: 1, coverImage: null },
    { id: 2, slug: "second", title: "Second", categoryName: "Opinion", categorySlug: "opinion", authorName: "B", readingMinutes: 2, coverImage: "https://picsum.photos/id/20" },
  ];

  test("loads results, moves with arrow keys and opens with Enter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ results }) });
    vi.stubGlobal("fetch", fetchMock);
    const onClose = vi.fn();
    render(<CommandPalette onClose={onClose} />);

    const input = screen.getByRole("combobox", { name: "Search articles" });
    expect(document.activeElement).toBe(input);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));

    const options = screen.getAllByRole("option");
    expect(options[0].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1].getAttribute("aria-selected")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[1].id);

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(push).toHaveBeenCalledWith("/articles/second");
    expect(onClose).toHaveBeenCalled();
  });

  test("sends the query and category to the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ results: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<CommandPalette onClose={() => {}} />);
    fireEvent.click(within(screen.getByRole("group", { name: "Filter by category" })).getByRole("button", { name: "Events" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "music" } });
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/search?q=music&category=events", expect.anything()));
    await waitFor(() => expect(screen.getByText("No articles match.")).toBeDefined());
  });
});
