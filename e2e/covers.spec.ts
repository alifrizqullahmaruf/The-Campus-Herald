import { expect, test, type Page } from "@playwright/test";
import { deflateSync } from "node:zlib";
import { AUTHOR_STATE } from "./auth";
import { deleteTestArticles, deleteTestUploads, uniqueTitle } from "./db";

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

/** A real PNG of one colour, made here so the test needs no file on disk. */
function png(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes: Buffer) => {
    let c = 0xffffffff;
    for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x5b)]);
  const pixels = deflateSync(Buffer.concat(Array.from({ length: height }, () => row)));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", pixels),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

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
