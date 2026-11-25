import { expect, test, type Browser, type Page } from "@playwright/test";
import { logIn, NO_SESSION } from "./auth";
import { axeViolations } from "./axe";
import { deleteTestUser, uniqueEmail } from "./db";

// Managing author accounts (Phase 4, day 5, docs/plans/2026-11-17-fase-4-alur-kerja.md).
// These tests write to the database: desktop project only, and each deletes the account it
// made when it ends. They run as the administrator; the new author logs in in a second
// browser context.

const FAILED = "That email and password do not match an active account.";
let email = "";
let name = "";

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "writes to the database: one project only");
  email = uniqueEmail();
  name = `E2E author ${email.slice(4, email.indexOf("@"))}`;
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== "desktop") return;
  // Through the app first: deactivating expires the cached author lists, and the public ones
  // leave inactive accounts out, so tests running alongside never see this account there.
  // The row deleted below then only lingers, inactive, in the cached admin list.
  await page.goto("/dashboard/authors");
  const deactivate = page.getByRole("button", { name: `Deactivate ${name}` });
  if (await deactivate.count()) {
    await deactivate.click();
    await expect(page.getByRole("button", { name: `Reactivate ${name}` })).toBeVisible();
  }
  await deleteTestUser(email);
});

/** Adds the author through the dialog and returns the temporary password shown once. */
async function addAuthor(page: Page): Promise<string> {
  await page.goto("/dashboard/authors");
  await page.getByRole("button", { name: "Add author" }).click();
  const dialog = page.getByRole("dialog", { name: "Add an author." });
  await dialog.getByRole("textbox", { name: "Name" }).fill(name);
  await dialog.getByRole("textbox", { name: "Email" }).fill(email.toUpperCase());
  await dialog.getByRole("button", { name: "Add author" }).click();
  const handover = page.getByRole("region", { name: "Temporary password" });
  await expect(handover).toContainText(`Temporary password for ${name}`);
  const password = (await handover.locator("code").textContent()) ?? "";
  expect(password).toMatch(/^[a-z2-9]{4}(-[a-z2-9]{4}){3}$/);
  return password;
}

/** A logged-out browser for the author, logged in with `password`. */
async function authorBrowser(browser: Browser, password: string) {
  const context = await browser.newContext({ storageState: NO_SESSION });
  const page = await context.newPage();
  await logIn(page, email, password);
  return { context, page };
}

test("a new author logs in with the temporary password", async ({ page, browser }) => {
  const password = await addAuthor(page);
  await expect(page.getByRole("main").getByRole("list").getByText(email, { exact: true })).toBeVisible();

  const author = await authorBrowser(browser, password);
  try {
    await expect(author.page).toHaveURL(/\/dashboard$/);
    await expect(author.page.getByRole("complementary").getByText(name)).toBeVisible();
  } finally {
    await author.context.close();
  }
});

test("an email that already has an account is refused, whatever its case", async ({ page }) => {
  await page.goto("/dashboard/authors");
  await page.getByRole("button", { name: "Add author" }).click();
  const dialog = page.getByRole("dialog", { name: "Add an author." });
  await dialog.getByRole("textbox", { name: "Name" }).fill(name);
  // Not in the list on screen as typed, so the server's check is the one that answers.
  await dialog.getByRole("textbox", { name: "Email" }).fill("DEWI.ADMIN@herald.test");
  await dialog.getByRole("button", { name: "Add author" }).click();
  await expect(dialog.getByText("An account with this email already exists.")).toBeVisible();
});

test("a deactivated author is logged out and cannot log in until reactivated", async ({ page, browser }) => {
  const password = await addAuthor(page);
  await page.getByRole("button", { name: "Done" }).click();
  const author = await authorBrowser(browser, password);
  try {
    await expect(author.page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: `Deactivate ${name}` }).click();
    await expect(page.getByRole("status").first()).toHaveText(`${name} can no longer log in.`);
    await author.page.goto("/dashboard");
    await expect(author.page).toHaveURL(/\/login$/);
    await logIn(author.page, email, password);
    await expect(author.page.getByRole("main").getByRole("alert")).toHaveText(FAILED);

    await page.getByRole("button", { name: `Reactivate ${name}` }).click();
    await expect(page.getByRole("status").first()).toHaveText(`${name} can log in again.`);
    await logIn(author.page, email, password);
    await expect(author.page).toHaveURL(/\/dashboard$/);
  } finally {
    await author.context.close();
  }
});

test("a reset ends the author's logins and only the new password works", async ({ page, browser }) => {
  const first = await addAuthor(page);
  await page.getByRole("button", { name: "Done" }).click();
  const author = await authorBrowser(browser, first);
  try {
    await expect(author.page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: `Reset password for ${name}` }).click();
    await page.getByRole("button", { name: "Yes, reset" }).click();
    const handover = page.getByRole("region", { name: "Temporary password" });
    await expect(handover).toContainText(`Temporary password for ${name}`);
    const second = (await handover.locator("code").textContent()) ?? "";
    expect(second).not.toBe(first);

    await author.page.goto("/dashboard");
    await expect(author.page).toHaveURL(/\/login$/);
    await logIn(author.page, email, first);
    await expect(author.page.getByRole("main").getByRole("alert")).toHaveText(FAILED);
    await logIn(author.page, email, second);
    await expect(author.page).toHaveURL(/\/dashboard$/);
  } finally {
    await author.context.close();
  }
});

test("the temporary password is gone once the administrator moves on", async ({ page }) => {
  await addAuthor(page);
  await page.getByRole("link", { name: /Review queue/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Review queue." })).toBeVisible();
  // Next keeps the authors page in the document, hidden; the password must leave it.
  await expect(page.locator("code")).toHaveCount(0);
});

test("the public author list drops a deactivated author and shows them again once reactivated", async ({ page, browser }) => {
  await addAuthor(page);
  await page.getByRole("button", { name: "Done" }).click();
  const reader = await browser.newContext({ storageState: NO_SESSION });
  try {
    const list = await reader.newPage();
    const card = list.getByRole("region", { name: "Authors" }).getByRole("link", { name: new RegExp(name) });
    await list.goto("/authors");
    await expect(card).toHaveCount(1);

    await page.getByRole("button", { name: `Deactivate ${name}` }).click();
    await expect(page.getByRole("button", { name: `Reactivate ${name}` })).toBeVisible();
    await list.goto("/authors");
    await expect(card).toHaveCount(0);

    await page.getByRole("button", { name: `Reactivate ${name}` }).click();
    await expect(page.getByRole("button", { name: `Deactivate ${name}` })).toBeVisible();
    await list.goto("/authors");
    await expect(card).toHaveCount(1);
  } finally {
    await reader.close();
  }
});

test("the Add author form explains empty or wrong fields, and Esc closes it", async ({ page }) => {
  await page.goto("/dashboard/authors");
  const open = page.getByRole("button", { name: "Add author" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Add an author." });
  await expect(dialog.getByRole("textbox", { name: "Name" })).toBeFocused();
  await dialog.getByRole("button", { name: "Add author" }).click();
  await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription("Enter the author's name.");
  await expect(dialog.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription("Enter a valid email address.");
  // Spaces are no name, and an address needs a domain.
  await dialog.getByRole("textbox", { name: "Name" }).fill("   ");
  await dialog.getByRole("textbox", { name: "Email" }).fill("someone@herald");
  await dialog.getByRole("button", { name: "Add author" }).click();
  await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription("Enter the author's name.");
  await expect(dialog.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription("Enter a valid email address.");
  expect(await axeViolations(page)).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
  // Opened again, the old messages are gone.
  await open.click();
  await expect(dialog.getByText("Enter the author's name.")).toHaveCount(0);
});

test("the author manager passes axe with the temporary password on screen", async ({ page }) => {
  await addAuthor(page);
  await expect(page.getByRole("dialog", { name: "Add an author." })).toBeHidden();
  expect(await axeViolations(page)).toEqual([]);
});
