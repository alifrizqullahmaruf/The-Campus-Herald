import { afterEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Marquee } from "../components/layout/marquee";
import { SiteFooter } from "../components/layout/site-footer";
import { SiteHeader } from "../components/layout/site-header";
import { getPublishedArticles } from "../lib/data/articles";
import { SITE } from "../lib/site";

afterEach(cleanup);

describe("SiteHeader", () => {
  test("has the main navigation and a search form that works without JavaScript", () => {
    render(<SiteHeader />);
    const nav = screen.getAllByRole("navigation", { name: "Main" })[0];
    for (const label of ["Latest", "Categories", "Authors", "About"]) {
      expect(within(nav).getByRole("link", { name: label })).toBeDefined();
    }
    const search = screen.getByRole("search");
    expect(search.getAttribute("action")).toBe("/search");
    expect(within(search).getByRole("searchbox").getAttribute("name")).toBe("q");
  });

  test("mobile menu opens, and closes on Escape", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeDefined();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Menu" })).toBeNull();
  });
});

describe("SiteFooter", () => {
  test("links to every public section and to the author log in", () => {
    render(<SiteFooter />);
    const nav = screen.getByRole("navigation", { name: "Footer" });
    expect(within(nav).getAllByRole("link")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Author log in" }).getAttribute("href")).toBe("/login");
  });
});

describe("Marquee", () => {
  test("is hidden from assistive tech and keeps its links out of the tab order", async () => {
    const articles = await getPublishedArticles({ limit: 3 });
    const { container } = render(<Marquee articles={articles} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    const links = root.querySelectorAll("a");
    // Two copies of the list for a seamless loop.
    expect(links).toHaveLength(6);
    links.forEach((link) => expect(link.getAttribute("tabindex")).toBe("-1"));
  });
});

describe("brand", () => {
  test("header logo says Side Notes, by The Campus Herald", () => {
    render(<SiteHeader />);
    const home = screen.getAllByRole("link").find((link) => link.getAttribute("href") === "/")!;
    expect(home.textContent).toContain("Side Notes");
    expect(home.textContent).toContain("by The Campus Herald");
  });

  test("footer credits The Campus Herald", () => {
    render(<SiteFooter />);
    expect(screen.getByText("© 2026 Side Notes · A community blog by The Campus Herald")).toBeDefined();
  });

  test("one source for the brand", () => {
    expect(SITE).toMatchObject({ name: "Side Notes", parent: "The Campus Herald", monogram: "SN" });
  });
});
