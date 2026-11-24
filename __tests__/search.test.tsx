import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { GET } from "../app/api/search/route";
import CommandPalette from "../components/search/command-palette";
import { CommandPaletteTrigger } from "../components/search/command-palette-trigger";
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
  vi.restoreAllMocks();
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
    const response = await GET(new Request("http://test/api/search?q=coffee"));
    const { results } = (await response.json()) as { results: SearchResult[] };
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("the-coffee-queue-is-a-design-problem-not-a-patience-problem");
    expect(results[0]).not.toHaveProperty("body");
    // The palette thumbnail uses the article's cover photo.
    expect(results[0].coverImage).toMatch(/^(\/covers\/12-\d+\.webp|https:\/\/images\.unsplash\.com\/)/);
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

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "coffee" } });
    expect(screen.getByText(/1 of \d+ articles match “coffee”/)).toBeDefined();
    // Only the matching card is exposed.
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(window.location.search).toBe("?q=coffee");
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
    { id: 2, slug: "second", title: "Second", categoryName: "Opinion", categorySlug: "opinion", authorName: "B", readingMinutes: 2, coverImage: "/covers/1-20.webp" },
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
    // Typed as a page change, so the new page fades in (components/ui/link.tsx).
    expect(push).toHaveBeenCalledWith("/articles/second", { transitionTypes: ["page"] });
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

describe("CommandPaletteTrigger", () => {
  // Browsers hide the dialog at once but fire its `close` event later; until then a
  // Ctrl+K was ignored (docs/plans/2026-11-24-ctrl-k-setelah-esc.md).
  function closeLate() {
    const late: HTMLDialogElement[] = [];
    vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function (this: HTMLDialogElement) {
      this.open = false;
      late.push(this);
    });
    return () => late.splice(0).forEach((dialog) => dialog.dispatchEvent(new Event("close")));
  }

  async function pressCtrlK() {
    await act(async () => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
  }

  const openDialog = () => document.querySelector<HTMLDialogElement>("dialog[open]");

  test.each([
    ["Esc", (dialog: HTMLDialogElement) => {
      // Esc fires `cancel`, then the browser closes the dialog itself.
      fireEvent(dialog, new Event("cancel"));
      dialog.close();
    }],
    ["the close button", () => fireEvent.click(screen.getByRole("button", { name: "Close search" }))],
  ])("Ctrl+K right after closing with %s opens it again", async (_, closeIt) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ results: [] }) }));
    const fireLateClose = closeLate();
    render(<CommandPaletteTrigger />);

    await pressCtrlK();
    await waitFor(() => expect(openDialog()).not.toBeNull());
    const first = openDialog()!;
    await act(async () => closeIt(first));
    expect(openDialog()).toBeNull();

    await pressCtrlK();
    await waitFor(() => expect(openDialog()).not.toBeNull());
    // The first dialog's late `close` event does not close the new one.
    await act(async () => fireLateClose());
    expect(openDialog()).not.toBeNull();
  });

  test("Esc returns focus to where it was before opening", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ results: [] }) }));
    closeLate();
    render(
      <>
        <button type="button">Before</button>
        <CommandPaletteTrigger />
      </>,
    );
    const before = screen.getByRole("button", { name: "Before" });
    before.focus();
    await pressCtrlK();
    await waitFor(() => expect(openDialog()).not.toBeNull());
    expect(document.activeElement).not.toBe(before);
    await act(async () => {
      fireEvent(openDialog()!, new Event("cancel"));
    });
    expect(document.activeElement).toBe(before);
  });
});
