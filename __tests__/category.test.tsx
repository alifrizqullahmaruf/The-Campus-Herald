import { afterEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CategoryTile } from "../components/category/category-tile";
import { LoadMore } from "../components/ui/load-more";
import { getCategoryBySlug } from "../lib/categories";

afterEach(cleanup);

describe("CategoryTile", () => {
  test("links to the desk and shows the archive count", () => {
    render(<CategoryTile category={getCategoryBySlug("events")!} count={4} />);
    expect(screen.getByRole("link", { name: "Events" }).getAttribute("href")).toBe("/categories/events");
    expect(screen.getByText("4 articles in the archive")).toBeDefined();
  });

  test("singular count", () => {
    render(<CategoryTile category={getCategoryBySlug("opinion")!} count={1} />);
    expect(screen.getByText("1 article in the archive")).toBeDefined();
  });
});

describe("LoadMore", () => {
  const items = Array.from({ length: 14 }, (_, i) => <li key={i}>Item {i + 1}</li>);

  test("reveals items in steps and hides the button at the end", () => {
    render(<LoadMore initial={6} step={6}>{items}</LoadMore>);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText("Showing 6 of 14")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(12);

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(14);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  test("no button when everything fits", () => {
    render(<LoadMore initial={6}>{items.slice(0, 3)}</LoadMore>);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
