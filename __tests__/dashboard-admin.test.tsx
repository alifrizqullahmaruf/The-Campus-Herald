import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AllArticles } from "../components/dashboard/all-articles";
import { AuthorManager, validateNewAuthor, type ManagedAuthor } from "../components/dashboard/author-manager";
import { ReviewPanel, validateReviewNote } from "../components/dashboard/review-panel";
import { getAllArticles } from "../lib/data/articles";

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

afterEach(cleanup);

describe("ReviewPanel", () => {
  test("approving takes a confirmation step", () => {
    render(<ReviewPanel initialStatus="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.getByText("Publish this article now?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Yes, publish" }));
    expect(screen.getByText("Published")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  test("sending back requires a note", () => {
    render(<ReviewPanel initialStatus="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Send back" }));
    const note = screen.getByLabelText("Note for the author");
    fireEvent.click(screen.getAllByRole("button", { name: "Send back" }).at(-1)!);
    expect(note.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(/Tell the author what to change/)).toBeDefined();

    fireEvent.change(note, { target: { value: "Please add a source for the figures." } });
    fireEvent.click(screen.getAllByRole("button", { name: "Send back" }).at(-1)!);
    expect(screen.getByText("Needs changes")).toBeDefined();
  });

  test("articles that are not pending cannot be decided again", () => {
    render(<ReviewPanel initialStatus="published" />);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Send back" })).toBeNull();
  });

  test("note rule", () => {
    expect(validateReviewNote("  fix  ")).not.toBeNull();
    expect(validateReviewNote("Add the vote counts.")).toBeNull();
  });
});

describe("AllArticles", () => {
  test("filters by status and author", async () => {
    const articles = await getAllArticles();
    render(<AllArticles articles={articles} />);
    const rows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows()).toHaveLength(articles.length);

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "pending" } });
    expect(rows()).toHaveLength(articles.filter((a) => a.status === "pending").length);

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Author"), { target: { value: "5" } });
    expect(rows()).toHaveLength(articles.filter((a) => a.authorId === 5).length);
  });
});

describe("AuthorManager", () => {
  const authors: ManagedAuthor[] = [
    { id: 2, name: "Rafi Pratama", email: "rafi@herald.test", isActive: true, articleCount: 4, hasAvatar: true },
    { id: 7, name: "Laras Wibowo", email: "laras@herald.test", isActive: false, articleCount: 1, hasAvatar: true },
  ];

  test("new author rules, including unique email", () => {
    expect(validateNewAuthor({ name: "", email: "x", password: "short" }, [])).toEqual({
      name: "Enter the author's name.",
      email: "Enter a valid email address.",
      password: "Use at least 8 characters.",
    });
    expect(validateNewAuthor({ name: "A", email: "RAFI@herald.test", password: "longenough" }, ["rafi@herald.test"]).email).toMatch(
      /already exists/,
    );
    expect(validateNewAuthor({ name: "A", email: "new@herald.test", password: "longenough" }, [])).toEqual({});
  });

  test("deactivates and reactivates; there is no delete", () => {
    render(<AuthorManager initialAuthors={authors} />);
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Deactivate Rafi Pratama" }));
    expect(screen.getByRole("status").textContent).toMatch(/Rafi Pratama is now deactivated/);
    expect(screen.getByRole("button", { name: "Reactivate Rafi Pratama" })).toBeDefined();
  });

  test("adds an author through the dialog", () => {
    render(<AuthorManager initialAuthors={authors} />);
    fireEvent.click(screen.getByRole("button", { name: "Add author" }));
    const dialog = screen.getByRole("dialog", { name: "Add an author." });
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Dina Kusuma" } });
    fireEvent.change(within(dialog).getByLabelText("Email"), { target: { value: "dina@herald.test" } });
    fireEvent.change(within(dialog).getByLabelText("Temporary password"), { target: { value: "campus-2026" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add author" }));
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByText("Dina Kusuma")).toBeDefined();
    expect(within(list).getByText("dina@herald.test")).toBeDefined();
    expect((dialog as HTMLDialogElement).open).toBe(false);
  });
});
