import type { Page } from "@playwright/test";

// Logging in with the sample accounts (Phase 3, docs/plans/2026-11-10-fase-3-login.md).
// Their password is DEV_PASSWORD, loaded from .env.local by playwright.config.ts and never
// printed. Run `npm run db:seed` first.

/** The sample accounts' password; throws with a hint when it is missing. */
export function devPassword(): string {
  const password = process.env.DEV_PASSWORD;
  if (!password) throw new Error("DEV_PASSWORD is not set. Run `npm run db:seed`, which adds it to .env.local.");
  return password;
}

/** Fills in and sends the login form. */
export async function logIn(page: Page, email: string, password: string = devPassword()) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}
