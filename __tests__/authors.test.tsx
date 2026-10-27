import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AuthorCard } from "../components/author/author-card";
import { getPublishedArticlesByAuthor } from "../lib/data/articles";
import { getAllAuthorIds, getAuthorProfile, getAuthorProfiles } from "../lib/data/users";

afterEach(cleanup);

describe("author data", () => {
  test("profiles carry the main category and published count", async () => {
    const sekar = (await getAuthorProfiles()).find((a) => a.name === "Sekar Ayu")!;
    expect(sekar.primaryCategory).toBe("opinion");
    expect(sekar.articleCount).toBe(3);
  });

  test("former members keep a profile page and their articles", async () => {
    const laras = await getAuthorProfile(7);
    expect(laras?.isActive).toBe(false);
    expect(await getAllAuthorIds()).toContain(7);
    expect((await getPublishedArticlesByAuthor(7)).map((a) => a.title)).toEqual(["Music student's piano recital earns a national scholarship"]);
  });

  test("the admin has no author page", async () => {
    expect(await getAuthorProfile(1)).toBeNull();
    expect(await getAllAuthorIds()).not.toContain(1);
  });

  test("author page lists only published articles", async () => {
    // Rafi (id 2) also has a draft.
    const list = await getPublishedArticlesByAuthor(2);
    expect(list.every((a) => a.status === "published")).toBe(true);
  });
});

describe("AuthorCard", () => {
  test("is one link named after the author; the flipped side is hidden from assistive tech", async () => {
    const [author] = await getAuthorProfiles();
    const { container } = render(<AuthorCard author={author} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(`/authors/${author.id}`);
    expect(link.textContent).toContain(author.name);
    const back = container.querySelectorAll("[aria-hidden='true']");
    expect([...back].some((el) => el.textContent?.includes(author.bio))).toBe(true);
  });
});
