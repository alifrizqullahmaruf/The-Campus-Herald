import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MyArticles } from "../components/dashboard/my-articles";
import { LoginForm } from "../components/dashboard/login-form";
import { login } from "@/lib/auth/actions";
import { LOGIN_FAILED, MAX_PASSWORD_LENGTH, homeFor, validateLogin } from "../lib/auth/login-rules";
import { Sidebar } from "../components/dashboard/sidebar";
import { isAdminPath } from "../lib/dashboard-paths";
import { ArticleEditor, isEditable, validateForSubmit } from "../components/editor/article-editor";
import { getArticleById, getArticlesByAuthor } from "../lib/data/articles";
import { getAllUsers } from "../lib/data/users";
import { saveDraft } from "@/lib/articles/actions";

const push = vi.fn();
const replace = vi.fn();
let pathname = "/dashboard";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
  push.mockReset();
  replace.mockReset();
  vi.mocked(saveDraft).mockClear();
  window.history.replaceState(null, "", "/");
});

describe("rules", () => {
  test("submit needs a title, a summary, a category and a body", () => {
    expect(validateForSubmit({ title: " ", summary: " ", categorySlug: "", bodyEmpty: true })).toEqual({
      title: "Give the article a title.",
      summary: "Write a short summary.",
      category: "Choose a category.",
      body: "Write the article before submitting it.",
    });
    expect(validateForSubmit({ title: "Hi", summary: "S", categorySlug: "events", bodyEmpty: false })).toEqual({});
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
    // Too long to be anyone's password: refused before scrypt, with the usual message.
    expect(validateLogin("rafi@herald.test", "x".repeat(MAX_PASSWORD_LENGTH + 1))).toBe(LOGIN_FAILED);
    expect(validateLogin(`${"a".repeat(250)}@x.co`, "x")).toMatch(/does not look right/);
  });

  test("the editor lands on the review queue, authors on their articles", () => {
    expect(homeFor("admin")).toBe("/dashboard/review");
    expect(homeFor("author")).toBe("/dashboard");
  });
});

describe("LoginForm", () => {
  test("catches empty fields in the browser, then sends the rest to the Server Action", async () => {
    vi.mocked(login).mockClear();
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Enter your email/);
    expect(login).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "rafi@herald.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong password" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText(LOGIN_FAILED)).toBeDefined();
    expect(login).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(login).mock.calls[0][1];
    expect([sent.get("email"), sent.get("password")]).toEqual(["rafi@herald.test", "wrong password"]);
    // The typed email stays after the failed attempt.
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("rafi@herald.test");
  });
});

describe("Sidebar", () => {
  test("marks the current page and shows who is logged in", async () => {
    const users = await getAllUsers();
    pathname = "/dashboard";
    render(<Sidebar user={users.find((u) => u.id === 2)!} pendingCount={0} />);
    const nav = screen.getAllByRole("navigation", { name: "Dashboard" })[0];
    expect(within(nav).getByRole("link", { name: /My articles/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Rafi Pratama")).toBeDefined();
  });

  test("authors see no editor links; the administrator's editor links are all admin pages", async () => {
    const users = await getAllUsers();
    pathname = "/dashboard";
    const { unmount } = render(<Sidebar user={users.find((u) => u.id === 2)!} pendingCount={0} />);
    for (const nav of screen.getAllByRole("navigation", { name: "Dashboard" })) {
      expect(within(nav).queryByRole("link", { name: /Review/ })).toBeNull();
      for (const link of within(nav).getAllByRole("link")) expect(isAdminPath(link.getAttribute("href")!)).toBe(false);
    }
    unmount();

    pathname = "/dashboard/review/20";
    render(<Sidebar user={users.find((u) => u.id === 1)!} pendingCount={2} />);
    const nav = screen.getAllByRole("navigation", { name: "Dashboard" })[0];
    expect(within(nav).getByRole("link", { name: /Review queue/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Dewi Lestari")).toBeDefined();
    const adminLinks = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href")!)
      .filter(isAdminPath);
    expect(adminLinks).toEqual(["/dashboard/review", "/dashboard/articles", "/dashboard/authors"]);
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
    render(<ArticleEditor article={null} canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(screen.getByText("Give the article a title.")).toBeDefined();
    expect(screen.getByText("Choose a category.")).toBeDefined();
    expect(screen.getByLabelText("Title").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("status").textContent).toMatch(/Fix the highlighted fields/);
  });

  test("a pending article is read-only", async () => {
    const pending = (await getArticleById(20))!;
    render(<ArticleEditor article={pending} canEdit />);
    expect(screen.queryByRole("button", { name: "Submit for review" })).toBeNull();
    expect((screen.getByLabelText("Title") as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/Waiting for the editor/)).toBeDefined();
  });

  test("a rejected article shows the editor's note and can be edited", async () => {
    const rejected = (await getArticleById(22))!;
    render(<ArticleEditor article={rejected} canEdit />);
    expect(screen.getByText("The editor sent this back")).toBeDefined();
    expect((screen.getByLabelText("Title") as HTMLInputElement).disabled).toBe(false);
  });

  test("someone else's article is read-only, without a save button", async () => {
    const rejected = (await getArticleById(22))!;
    render(<ArticleEditor article={rejected} canEdit={false} />);
    expect(screen.queryByRole("button", { name: "Save draft" })).toBeNull();
    expect((screen.getByLabelText("Summary") as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.getByText("Only the author can change this article.")).toBeDefined();
  });

  test("save draft needs a category and does not call the server without one", () => {
    render(<ArticleEditor article={null} canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(screen.getByText("Choose a category.")).toBeDefined();
    expect(saveDraft).not.toHaveBeenCalled();
  });

  test("save draft sends the fields and moves a new article to its own address", async () => {
    render(<ArticleEditor article={null} canEdit />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Library opens late" } });
    fireEvent.change(screen.getByLabelText("Summary"), { target: { value: "Open until midnight." } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "academics" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/articles/101?saved=1", { scroll: false }));
    expect(saveDraft).toHaveBeenCalledWith({
      id: null,
      title: "Library opens late",
      summary: "Open until midnight.",
      categorySlug: "academics",
      body: "",
    });
  });

  test("the article's own page says it was just saved, once", async () => {
    const draft = (await getArticleById(19))!;
    window.history.replaceState(null, "", "/dashboard/articles/19?saved=1");
    render(<ArticleEditor article={draft} canEdit justSaved />);
    expect(screen.getByRole("status").textContent).toBe("Draft saved.");
    expect(window.location.search).toBe("");
  });

  test("an existing draft saves under its id and shows the server's errors", async () => {
    const draft = (await getArticleById(19))!;
    vi.mocked(saveDraft).mockResolvedValueOnce({
      ok: false,
      errors: { title: "Keep the title under 200 characters." },
      message: "Fix the highlighted fields, then save again.",
    });
    render(<ArticleEditor article={draft} canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByText("Keep the title under 200 characters.")).toBeDefined();
    // The body is whatever the editor holds: the stored one, or Tiptap's own spelling of it
    // once it has loaded (list items as <li><p>), so only the other fields are compared.
    expect(saveDraft).toHaveBeenCalledWith(expect.objectContaining({ id: 19, summary: draft.excerpt, title: draft.title }));
  });
});
