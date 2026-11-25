import { expect, test, type Page } from "@playwright/test";
import { AUTHOR_STATE } from "./auth";
import { deleteTestArticles, deleteTestUploads, uniqueTitle } from "./db";
import { png } from "./png";

// Uploading a cover photo (Phase 4, day 6, docs/plans/2026-11-17-fase-4-alur-kerja.md). These
// tests write to the database and the upload folder: desktop project only, and each deletes
// its own article and every file it uploaded, saved or not, when it ends.

let title = "";
let uploaded: string[] = [];
test.beforeEach(({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "writes to the database: one project only");
  title = uniqueTitle();
  uploaded = [];
  // Every cover this page receives, so the files can be removed even if the test fails.
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
test.use({ storageState: AUTHOR_STATE });

async function newDraft(page: Page) {
  await page.goto("/dashboard/articles/new");
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await page.getByRole("textbox", { name: "Summary" }).fill("With a cover from the end-to-end test.");
  await page.getByRole("combobox", { name: "Category" }).selectOption("events");
  await page.getByRole("textbox", { name: "Article" }).click();
  await page.keyboard.type("The first paragraph.");
}

test("an uploaded cover and its description are saved with the article", async ({ page, request }) => {
  await newDraft(page);
  await page.getByLabel("Cover image").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png(2400, 1600) });
  const preview = page.getByRole("img", { name: /^Cover/ });
  await expect(preview).toBeVisible();
  const src = (await preview.getAttribute("src")) ?? "";
  expect(src, "made smaller in the browser and stored as WebP").toMatch(/^\/uploads\/[0-9a-f-]{36}\.webp$/);

  const file = await request.get(src);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-type"]).toBe("image/webp");
  expect(file.headers()["x-content-type-options"]).toBe("nosniff");

  await page.getByRole("textbox", { name: "Describe the image" }).fill("A blue test card");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toHaveText("Draft saved.");
  await page.reload();
  await expect(page.getByRole("img", { name: "Cover: A blue test card" })).toHaveAttribute("src", src);
  await expect(page.getByRole("textbox", { name: "Describe the image" })).toHaveValue("A blue test card");
});

test("a file that is not a photo is refused", async ({ page }) => {
  await newDraft(page);
  await page.getByLabel("Cover image").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from("<svg onload=alert(1)>") });
  await expect(page.getByText("Choose a JPEG, PNG or WebP photo.")).toBeVisible();
  await expect(page.getByRole("img", { name: /^Cover/ })).toHaveCount(0);
});

test("a cover without a description cannot be submitted, and can be removed", async ({ page }) => {
  await newDraft(page);
  await page.getByLabel("Cover image").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png(400, 300) });
  await expect(page.getByRole("img", { name: /^Cover/ })).toBeVisible();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Describe the cover image.")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/articles\/new$/);

  await page.getByRole("button", { name: "Remove cover" }).click();
  await expect(page.getByRole("img", { name: /^Cover/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByRole("status")).toHaveText("Sent to the editor for review.");
});

test("only server-made names are served from /uploads", async ({ request }) => {
  for (const path of ["/uploads/../package.json", "/uploads/x.png", "/uploads/00000000-0000-0000-0000-000000000000.webp"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});
