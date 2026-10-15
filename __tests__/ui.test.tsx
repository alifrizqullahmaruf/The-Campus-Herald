import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Button } from "../components/ui/button";
import { CategoryPill } from "../components/ui/category-pill";
import { StatusBadge } from "../components/ui/status-badge";

afterEach(cleanup);

describe("Button", () => {
  test("renders a link when given href, a button otherwise", () => {
    render(
      <>
        <Button href="/articles" arrow>
          Read
        </Button>
        <Button>Save</Button>
      </>,
    );
    expect(screen.getByRole("link", { name: /Read/ }).getAttribute("href")).toBe("/articles");
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("type")).toBe("button");
  });
});

describe("CategoryPill", () => {
  test("links to the category page and announces the count", () => {
    render(<CategoryPill slug="academics" count={4} />);
    const link = screen.getByRole("link", { name: /Academics.*4 articles/ });
    expect(link.getAttribute("href")).toBe("/categories/academics");
    expect(link.className).toContain("bg-cat-academics");
    expect(link.className).toContain("text-white");
  });
});

describe("StatusBadge", () => {
  test.each([
    ["draft", "Draft"],
    ["pending", "Waiting for review"],
    ["published", "Published"],
    ["rejected", "Needs changes"],
  ] as const)("%s shows the label %s", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeDefined();
  });
});
