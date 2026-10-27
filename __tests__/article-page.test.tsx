import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ArticleBody } from "../components/article/article-body";
import { AuthorBox } from "../components/article/author-box";
import { FiledUnder } from "../components/article/filed-under";
import { getArticleBySlug } from "../lib/data/articles";

afterEach(cleanup);

describe("ArticleBody", () => {
  test("renders the HTML body with the category colour for pull quotes", async () => {
    const article = (await getArticleBySlug("whats-on-the-desk-of-the-students-who-top-their-year"))!;
    const { container } = render(<ArticleBody article={article} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("prose-herald");
    expect(root.querySelector("blockquote")).not.toBeNull();
    expect(root.querySelector("h2")?.textContent).toBe("What happens next");
    expect(root.style.getPropertyValue("--cat-bg")).toBe("var(--color-cat-academics)");
    // Academics is blue, so the quote text is white.
    expect(root.style.getPropertyValue("--cat-fg")).toBe("#ffffff");
  });
});

describe("FiledUnder", () => {
  test("links to the category and to all articles", () => {
    render(<FiledUnder slug="events" />);
    expect(screen.getByRole("link", { name: "More in Events →" }).getAttribute("href")).toBe("/categories/events");
    expect(screen.getByRole("link", { name: "All articles →" }).getAttribute("href")).toBe("/search");
  });
});

describe("AuthorBox", () => {
  test("shows the byline and links to the author page", () => {
    render(
      <AuthorBox
        author={{ id: 5, name: "Sekar Ayu", bio: "Strong opinions.", beat: "Opinion columnist" }}
      />,
    );
    expect(screen.getByText("Sekar Ayu")).toBeDefined();
    expect(screen.getByRole("link", { name: /More from Sekar/ }).getAttribute("href")).toBe("/authors/5");
  });
});
