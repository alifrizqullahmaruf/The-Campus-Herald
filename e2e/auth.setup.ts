import { expect, test as setup } from "@playwright/test";
import { ADMIN_STATE, AUTHOR_STATE, logIn } from "./auth";

// Logs in once per role and saves the session for the other tests (Phase 3,
// docs/plans/2026-11-10-fase-3-login.md). Every project uses the admin session by default,
// since the administrator may open every dashboard page; e2e/access.spec.ts uses the
// author session and no session.

setup("log in as the administrator", async ({ page }) => {
  await logIn(page, "dewi.admin@herald.test");
  await expect(page).toHaveURL(/\/dashboard\/review$/);
  await page.context().storageState({ path: ADMIN_STATE });
});

setup("log in as an author", async ({ page }) => {
  await logIn(page, "rafi@herald.test");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: AUTHOR_STATE });
});
