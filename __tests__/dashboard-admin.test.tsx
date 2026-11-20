import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AllArticles } from "../components/dashboard/all-articles";
import { AuthorManager, validateNewAuthor, type ManagedAuthor } from "../components/dashboard/author-manager";
import { ReviewPanel, validateReviewNote } from "../components/dashboard/review-panel";
import { getAllArticles } from "../lib/data/articles";
import { approveArticle, rejectArticle } from "@/lib/articles/review-actions";
import { createAuthor, resetAuthorPassword, setAuthorActive } from "@/lib/auth/author-actions";

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
  vi.mocked(approveArticle).mockClear();
  vi.mocked(rejectArticle).mockClear();
  vi.mocked(createAuthor).mockClear();
  vi.mocked(setAuthorActive).mockClear();
  vi.mocked(resetAuthorPassword).mockClear();
});

describe("ReviewPanel", () => {
  test("approving takes a confirmation step, then stores the decision", async () => {
    render(<ReviewPanel articleId={20} initialStatus="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.getByText("Publish this article now?")).toBeDefined();
    expect(approveArticle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, publish" }));
    expect(await screen.findByText("Approved and published.")).toBeDefined();
    expect(approveArticle).toHaveBeenCalledWith(20);
    expect(screen.getByText("Published")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  test("sending back requires a note, which goes with the decision", async () => {
    render(<ReviewPanel articleId={21} initialStatus="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Send back" }));
    const note = screen.getByLabelText("Note for the author");
    fireEvent.click(screen.getAllByRole("button", { name: "Send back" }).at(-1)!);
    expect(note.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText(/Tell the author what to change/)).toBeDefined();
    expect(rejectArticle).not.toHaveBeenCalled();

    fireEvent.change(note, { target: { value: "Please add a source for the figures." } });
    fireEvent.click(screen.getAllByRole("button", { name: "Send back" }).at(-1)!);
    expect(await screen.findByText("Sent back to the author with your note.")).toBeDefined();
    expect(rejectArticle).toHaveBeenCalledWith(21, "Please add a source for the figures.");
    expect(screen.getByText("Needs changes")).toBeDefined();
  });

  test("the server's refusal is shown and the article stays pending", async () => {
    vi.mocked(approveArticle).mockResolvedValueOnce({
      ok: false,
      error: "gone",
      message: "This article is no longer waiting for review. Reload the page to see where it is.",
    });
    render(<ReviewPanel articleId={20} initialStatus="pending" />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, publish" }));
    expect(await screen.findByText(/no longer waiting for review/)).toBeDefined();
    expect(screen.getByText("Waiting for review")).toBeDefined();
  });

  test("articles that are not pending cannot be decided again", () => {
    render(<ReviewPanel articleId={1} initialStatus="published" />);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Send back" })).toBeNull();
  });

  test("note rule", () => {
    expect(validateReviewNote("  fix  ")).not.toBeNull();
    expect(validateReviewNote("Add the vote counts.")).toBeNull();
    expect(validateReviewNote("a".repeat(2001))).toMatch(/under 2000/);
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
    { id: 2, name: "Rafi Pratama", email: "rafi@herald.test", isActive: true, articleCount: 4 },
    { id: 7, name: "Laras Wibowo", email: "laras@herald.test", isActive: false, articleCount: 1 },
  ];

  test("new author rules, including unique email", () => {
    expect(validateNewAuthor({ name: "", email: "x" }, [])).toEqual({
      name: "Enter the author's name.",
      email: "Enter a valid email address.",
    });
    expect(validateNewAuthor({ name: "A", email: " RAFI@herald.test " }, ["rafi@herald.test"]).email).toMatch(/already exists/);
    expect(validateNewAuthor({ name: "a".repeat(101), email: "new@herald.test" }, []).name).toMatch(/under 100/);
    expect(validateNewAuthor({ name: "A", email: `${"a".repeat(140)}@herald.test` }, []).email).toMatch(/valid email/);
    expect(validateNewAuthor({ name: "A", email: "new@herald.test" }, [])).toEqual({});
  });

  test("deactivates and reactivates through the server; there is no delete", async () => {
    render(<AuthorManager initialAuthors={authors} />);
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Deactivate Rafi Pratama" }));
    expect(await screen.findByText("Rafi Pratama can no longer log in.")).toBeDefined();
    expect(setAuthorActive).toHaveBeenCalledWith(2, false);
    fireEvent.click(screen.getByRole("button", { name: "Reactivate Rafi Pratama" }));
    expect(await screen.findByText("Rafi Pratama can log in again.")).toBeDefined();
    expect(setAuthorActive).toHaveBeenLastCalledWith(2, true);
  });

  test("adds an author and shows the temporary password once", async () => {
    render(<AuthorManager initialAuthors={authors} />);
    fireEvent.click(screen.getByRole("button", { name: "Add author" }));
    const dialog = screen.getByRole("dialog", { name: "Add an author." });
    expect(within(dialog).queryByLabelText(/password/i)).toBeNull();
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Dina Kusuma" } });
    fireEvent.change(within(dialog).getByLabelText("Email"), { target: { value: "Dina@herald.test" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add author" }));
    const handover = await screen.findByRole("region", { name: "Temporary password" });
    expect(within(handover).getByText("abcd-efgh-jkmn-pqrs")).toBeDefined();
    expect(createAuthor).toHaveBeenCalledWith({ name: "Dina Kusuma", email: "Dina@herald.test" });
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByText("dina@herald.test")).toBeDefined();
    expect((dialog as HTMLDialogElement).open).toBe(false);
    fireEvent.click(within(handover).getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("region", { name: "Temporary password" })).toBeNull();
  });

  test("an email the server already has is shown in the form", async () => {
    vi.mocked(createAuthor).mockResolvedValueOnce({
      ok: false,
      errors: { email: "An account with this email already exists." },
      message: "Fix the highlighted fields.",
    });
    render(<AuthorManager initialAuthors={authors} />);
    fireEvent.click(screen.getByRole("button", { name: "Add author" }));
    const dialog = screen.getByRole("dialog", { name: "Add an author." });
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "Someone" } });
    fireEvent.change(within(dialog).getByLabelText("Email"), { target: { value: "taken@herald.test" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add author" }));
    expect(await within(dialog).findByText("An account with this email already exists.")).toBeDefined();
    expect((dialog as HTMLDialogElement).open).toBe(true);
  });

  test("resetting a password takes a confirmation, then shows the new one", async () => {
    render(<AuthorManager initialAuthors={authors} />);
    fireEvent.click(screen.getByRole("button", { name: "Reset password for Rafi Pratama" }));
    expect(resetAuthorPassword).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, reset" }));
    const handover = await screen.findByRole("region", { name: "Temporary password" });
    expect(within(handover).getByText("wxyz-2345-6789-abcd")).toBeDefined();
    expect(resetAuthorPassword).toHaveBeenCalledWith(2);
  });
});
