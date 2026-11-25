import { expect, test, type Page } from "@playwright/test";
import { slugify } from "../lib/articles/draft-rules";
import { ADMIN_STATE, AUTHOR_STATE, NO_SESSION } from "./auth";
import { axeViolations } from "./axe";
import {
  backdateTestArticle,
  countTestArticles,
  deleteTestArticles,
  deleteTestUploads,
  insertArticle,
  reviewOf,
  statusOf,
  uniqueTitle,
} from "./db";
import { png } from "./png";

// Phase 4 QA (docs/plans/2026-11-25-qa-fase-4.md): the whole workflow end to end, across the
// author and the administrator, where the per-day specs (drafts, submit, review, covers) stop
// at one step. These tests write to the database: desktop project only, and each deletes its
// own rows and uploads (by a unique title) when it ends. Articles that get published are dated
// 2000, so they sort after every sample article and never move the front page for the tests
// running alongside; the home page is therefore not checked here. They are deleted straight
// from the database afterwards, so the cached public lists keep a card for them (a 404) until
// the app saves something, as in review.spec.ts.

let title = "";
let uploaded: string[] = [];
test.beforeEach(({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "writes to the database: one project only");
  title = uniqueTitle();
  uploaded = [];
  page.on("response", async (response) => {
    if (response.request().method() !== "POST") return;
    const text = await response.text().catch(() => "");
    for (const match of text.matchAll(/\/uploads\/[0-9a-f-]{36}\.(?:webp|jpg|png)/g)) uploaded.push(match[0]);
  });
});
test.afterEach(async ({}, testInfo) => {
  if (testInfo.project.name !== "desktop") return;
  await deleteTestArticles(title);
  await deleteTestUploads(uploaded);
});

async function approve(page: Page, id: number) {
  await page.goto(`/dashboard/review/${id}`);
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Yes, publish" }).click();
  await expect(page.getByRole("status")).toHaveText("Approved and published.");
}

test("an approved article shows on its author's page on the first visit", async ({ page }) => {
  test.fixme(
    true,
    // Also alone (--workers=1, 3 of 3); a reload then shows the article.
    "QA-F4-1: the first /authors/<id> render after an approval still lists the old articles and count; the next visit is right",
  );
  const { id } = await insertArticle(title, "pending");
  await approve(page, id);
  await page.goto("/authors/2");
  await expect(page.getByRole("main").getByRole("link", { name: title })).toBeVisible();
});

test("an approved article shows in search and on its topic page", async ({ page }) => {
  const { id } = await insertArticle(title, "pending");
  await approve(page, id);

  await page.goto(`/search?q=${encodeURIComponent(title)}`);
  await expect(page.getByRole("main").getByRole("link", { name: title })).toBeVisible();

  // Dated 2000, so it is the last Opinion card, behind "Load more". Alone the first visit is
  // right; in the full run other projects render this page while the approval expires the
  // cache, and one of those renders can be stored stale, so the check may take a reload.
  const card = page.getByRole("region", { name: "Opinion articles" }).getByRole("link", { name: title });
  const more = page.getByRole("button", { name: "Load more" });
  await expect(async () => {
    await page.goto("/categories/opinion");
    while ((await card.count()) === 0 && (await more.count()) > 0) await more.click();
    await expect(card).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
});

test("a sent-back article is revised, resubmitted with the earlier note shown, then approved", async ({ page, browser }) => {
  const { id, slug } = await insertArticle(title, "pending");
  const note = "Name the source of the survey figures.";
  await page.goto(`/dashboard/review/${id}`);
  await page.getByRole("button", { name: "Send back" }).click();
  await page.getByRole("textbox", { name: "Note for the author" }).fill(note);
  await page.getByRole("button", { name: "Send back" }).last().click();
  await expect(page.getByRole("status")).toHaveText("Sent back to the author with your note.");

  const author = await browser.newContext({ storageState: AUTHOR_STATE });
  try {
    const editor = await author.newPage();
    await editor.goto(`/dashboard/articles/${id}`);
    await expect(editor.getByRole("note").filter({ hasText: "The editor sent this back" })).toContainText(note);
    await editor.waitForLoadState("networkidle");
    expect(await axeViolations(editor), "the editor with the editor's note").toEqual([]);

    await editor.getByRole("textbox", { name: "Summary" }).fill("Now with the source of the figures.");
    await editor.getByRole("button", { name: "Submit for review" }).click();
    await expect(editor.getByRole("status")).toHaveText("Sent to the editor for review.");
    await expect(editor.getByText(/Waiting for the editor/)).toBeVisible();
    expect(await statusOf(id)).toBe("pending");
  } finally {
    await author.close();
  }

  // Not public while it waits again.
  const reader = await browser.newContext({ storageState: NO_SESSION });
  try {
    const visit = await reader.newPage();
    await visit.goto(`/articles/${slug}`);
    await expect(visit.getByRole("heading", { level: 1 })).toHaveText("This page is not in the margins.");
  } finally {
    await reader.close();
  }

  await page.goto("/dashboard/review");
  await expect(page.getByRole("main").getByRole("link", { name: title })).toBeVisible();
  await page.goto(`/dashboard/review/${id}`);
  await expect(page.getByRole("note").filter({ hasText: "Your earlier note" })).toContainText(note);
  await expect(page.getByRole("main").getByText("Now with the source of the figures.")).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Yes, publish" }).click();
  await expect(page.getByRole("status")).toHaveText("Approved and published.");
  expect(await reviewOf(id)).toMatchObject({ status: "published", review_note: null });

  await page.goto(`/articles/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
});

test.describe("as an author", () => {
  test.use({ storageState: AUTHOR_STATE });

  test("a cover needs a description to be submitted, and the published article reads it out", async ({ page, browser }) => {
    await page.goto("/dashboard/articles/new");
    await page.getByRole("textbox", { name: "Title" }).fill(title);
    await page.getByRole("textbox", { name: "Summary" }).fill("With a described cover.");
    await page.getByRole("combobox", { name: "Category" }).selectOption("events");
    await page.getByRole("textbox", { name: "Article" }).click();
    await page.keyboard.type("The first paragraph.");
    await page.getByLabel("Cover image").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png(800, 600) });
    await expect(page.getByRole("img", { name: /^Cover/ })).toBeVisible();

    // A description of spaces only is no description.
    await page.getByRole("textbox", { name: "Describe the image" }).fill("   ");
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText("Describe the cover image.")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Describe the image" })).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/dashboard\/articles\/new$/);

    await page.getByRole("textbox", { name: "Describe the image" }).fill("A grey test card");
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByRole("status")).toHaveText("Sent to the editor for review.");
    const id = Number(new URL(page.url()).pathname.split("/").pop());
    await backdateTestArticle(id);

    const admin = await browser.newContext({ storageState: ADMIN_STATE });
    try {
      const review = await admin.newPage();
      await review.goto(`/dashboard/review/${id}`);
      await expect(review.getByRole("main").getByRole("img", { name: "A grey test card" })).toBeVisible();
      await approve(review, id);
    } finally {
      await admin.close();
    }

    const reader = await browser.newContext({ storageState: NO_SESSION });
    try {
      const visit = await reader.newPage();
      await visit.goto(`/articles/${slugify(title)}`);
      await expect(visit.getByRole("heading", { level: 1 })).toHaveText(title);
      const cover = visit.getByRole("main").getByRole("img", { name: "A grey test card" });
      await expect(cover).toBeVisible();
      await visit.waitForLoadState("networkidle");
      expect(await axeViolations(visit)).toEqual([]);
    } finally {
      await reader.close();
    }
  });

  test("a double click on Save draft stores one draft", async ({ page }) => {
    await page.goto("/dashboard/articles/new");
    await page.getByRole("textbox", { name: "Title" }).fill(title);
    await page.getByRole("combobox", { name: "Category" }).selectOption("events");
    await expect(page.getByRole("textbox", { name: "Article" })).toBeVisible();
    await page.getByRole("button", { name: "Save draft" }).dblclick();
    await expect(page.getByRole("status")).toHaveText("Draft saved.");
    await expect(page).toHaveURL(/\/dashboard\/articles\/\d+$/);
    // A second action, had one been sent, would still be running: give it time to land.
    await page.waitForTimeout(1_000);
    expect(await countTestArticles(title)).toBe(1);
  });

  test("a double click on Submit sends one article", async ({ page }) => {
    await page.goto("/dashboard/articles/new");
    await page.getByRole("textbox", { name: "Title" }).fill(title);
    await page.getByRole("textbox", { name: "Summary" }).fill("Sent with a double click.");
    await page.getByRole("combobox", { name: "Category" }).selectOption("events");
    await page.getByRole("textbox", { name: "Article" }).click();
    await page.keyboard.type("The first paragraph.");
    await page.getByRole("button", { name: "Submit for review" }).dblclick();
    await expect(page.getByRole("status")).toHaveText("Sent to the editor for review.");
    await page.waitForTimeout(1_000);
    expect(await countTestArticles(title)).toBe(1);
  });

  test("the editor's error messages are tied to their fields and pass axe", async ({ page }) => {
    await page.goto("/dashboard/articles/new");
    await expect(page.getByRole("textbox", { name: "Article" })).toBeVisible();
    await page.getByRole("button", { name: "Submit for review" }).click();
    for (const [name, message] of [
      ["Title", "Give the article a title."],
      ["Summary", "Write a short summary."],
    ] as const) {
      const field = page.getByRole("textbox", { name });
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toHaveAccessibleDescription(new RegExp(message.replace(".", "\\.")));
    }
    await expect(page.getByRole("combobox", { name: "Category" })).toHaveAccessibleDescription("Choose a category.");
    await expect(page.getByText("Write the article before submitting it.")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(await axeViolations(page)).toEqual([]);

    // Too long a title is cut at the column's 200 characters as it is typed.
    await page.getByRole("textbox", { name: "Title" }).fill(`${title} ${"x".repeat(300)}`);
    expect((await page.getByRole("textbox", { name: "Title" }).inputValue()).length).toBe(200);
    expect(await countTestArticles(title)).toBe(0);
  });
});

test("a review note that is too short is refused, and Cancel leaves the article waiting", async ({ page }) => {
  const { id } = await insertArticle(title, "pending");
  await page.goto(`/dashboard/review/${id}`);
  await page.getByRole("button", { name: "Send back" }).click();
  const note = page.getByRole("textbox", { name: "Note for the author" });
  await note.fill("Too short"); // 9 characters
  await page.getByRole("button", { name: "Send back" }).last().click();
  await expect(note).toHaveAttribute("aria-invalid", "true");
  await expect(note).toHaveAccessibleDescription(/at least 10 characters/);
  await page.waitForLoadState("networkidle");
  expect(await axeViolations(page)).toEqual([]);

  // Spaces around the note do not count towards its length.
  await note.fill("   Too short   ");
  await page.getByRole("button", { name: "Send back" }).last().click();
  await expect(note).toHaveAccessibleDescription(/at least 10 characters/);

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("textbox", { name: "Note for the author" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();

  // Approving asks first; Cancel keeps it waiting too.
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: "Yes, publish" })).toHaveCount(0);
  expect(await statusOf(id)).toBe("pending");
});
