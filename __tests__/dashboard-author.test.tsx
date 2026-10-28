import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MyArticles } from "../components/dashboard/my-articles";
import { LoginForm, validateLogin } from "../components/dashboard/login-form";
import { Sidebar } from "../components/dashboard/sidebar";
import { ArticleEditor, isEditable, validateForSubmit } from "../components/editor/article-editor";
import { getArticleById, getArticlesByAuthor } from "../lib/data/articles";
import { getAllUsers } from "../lib/data/users";

const push = vi.fn();
let pathname = "/dashboard";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
  push.mockReset();
});

describe("rules", () => {
  test("submit needs a title, a category and a body", () => {
    expect(validateForSubmit({ title: " ", categorySlug: "", bodyEmpty: true })).toEqual({
      title: "Give the article a title.",
      category: "Choose a category.",
      body: "Write the article before submitting it.",
    });
    expect(validateForSubmit({ title: "Hi", categorySlug: "events", bodyEmpty: false })).toEqual({});
  });

  test("only drafts and sent-back articles are editable", () => {
    expect(isEditable("draft")).toBe(true);
    expect(isEditable("rejected")).toBe(true);
    expect(isEditable("pending")).toBe(false);
    expect(isEditable("published")).toBe(false);
  });

  test("login validation", () => {
    expect(validateLogin("", "")).toMatch(/Enter your email/);
    expect(validateLogin("rafi", "x")).toMatch(/does not look right/);
    expect(validateLogin("rafi@herald.test", "x")).toBeNull();
  });
});

describe("LoginForm", () => {
  test("shows an error, then opens the dashboard when valid", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Enter your email/);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "rafi@herald.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    // Typed as a page change, so the new page fades in (components/ui/link.tsx).
    expect(push).toHaveBeenCalledWith("/dashboard", { transitionTypes: ["page"] });
  });
});

describe("Sidebar", () => {
  test("marks the current page and switches the preview user on editor pages", async () => {
    const users = await getAllUsers();
    const author = users.find((u) => u.id === 2)!;
    const admin = users.find((u) => u.id === 1)!;

    pathname = "/dashboard";
    const { unmount } = render(<Sidebar author={author} admin={admin} pendingCount={2} />);
    const nav = screen.getAllByRole("navigation", { name: "Dashboard" })[0];
    expect(within(nav).getByRole("link", { name: /My articles/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Rafi Pratama")).toBeDefined();
    unmount();

    pathname = "/dashboard/review/20";
    render(<Sidebar author={author} admin={admin} pendingCount={2} />);
    const nav2 = screen.getAllByRole("navigation", { name: "Dashboard" })[0];
    expect(within(nav2).getByRole("link", { name: /Review queue/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Dewi Lestari")).toBeDefined();
  });
});

describe("MyArticles", () => {
  test("filters by status with counts", async () => {
    const articles = await getArticlesByAuthor(2);
    render(<MyArticles articles={articles} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(articles.length);
    fireEvent.click(screen.getByRole("button", { name: /^Draft/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /^Needs changes/ }));
    expect(screen.getByText("Nothing here yet.")).toBeDefined();
  });

  test("rejected articles show the editor's note", async () => {
    const articles = await getArticlesByAuthor(3);
    render(<MyArticles articles={articles} />);
    expect(screen.getByText(/confirm the vote counts/)).toBeDefined();
  });
});

describe("ArticleEditor", () => {
  test("a new article cannot be submitted empty", () => {
    render(<ArticleEditor article={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(screen.getByText("Give the article a title.")).toBeDefined();
    expect(screen.getByText("Choose a category.")).toBeDefined();
    expect(screen.getByLabelText("Title").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("status").textContent).toMatch(/Fix the highlighted fields/);
  });

  test("a pending article is read-only", async () => {
    const pending = (await getArticleById(20))!;
    render(<ArticleEditor article={pending} />);
    expect(screen.queryByRole("button", { name: "Submit for review" })).toBeNull();
    expect((screen.getByLabelText("Title") as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/Waiting for the editor/)).toBeDefined();
  });

  test("a rejected article shows the editor's note and can be edited", async () => {
    const rejected = (await getArticleById(22))!;
    render(<ArticleEditor article={rejected} />);
    expect(screen.getByText("The editor sent this back")).toBeDefined();
    expect((screen.getByLabelText("Title") as HTMLInputElement).disabled).toBe(false);
  });
});
