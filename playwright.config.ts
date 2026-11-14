import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { ADMIN_STATE } from "./e2e/auth";

const PORT = 3200;

// DEV_PASSWORD (the sample accounts' password, from `npm run db:seed`) for the login tests.
// Like the seed's --env-file, a value already in the environment is not replaced.
try {
  process.loadEnvFile(join(__dirname, ".env.local"));
} catch {
  // No .env.local: the login tests say what is missing (e2e/auth.ts).
}

// End-to-end tests against a production build. Uses the locally installed
// Microsoft Edge (channel "msedge"), so no browser download is needed.
// Run `npm run build` first; `npm run test:e2e` then starts `next start`.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "msedge",
    trace: "retain-on-failure",
  },
  projects: [
    // Logs in once per role (e2e/auth.setup.ts); every other project starts as the administrator.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // Everything except the phone-only specs, at 1280×720 (responsive.spec.ts included).
    {
      name: "desktop",
      use: { ...devices["Desktop Edge"], channel: "msedge", storageState: ADMIN_STATE },
      dependencies: ["setup"],
      testIgnore: /mobile\.spec\.ts/,
    },
    // Layout checks at the widths docs/design.md targets (docs/plans/2026-10-22-responsif.md).
    {
      name: "phone-320",
      use: { channel: "msedge", viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, storageState: ADMIN_STATE },
      dependencies: ["setup"],
      testMatch: /(mobile|responsive)\.spec\.ts/,
    },
    {
      name: "phone",
      use: { channel: "msedge", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, storageState: ADMIN_STATE },
      dependencies: ["setup"],
      testMatch: /(mobile|responsive)\.spec\.ts/,
    },
    {
      name: "tablet",
      use: { channel: "msedge", viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true, storageState: ADMIN_STATE },
      dependencies: ["setup"],
      testMatch: /responsive\.spec\.ts/,
    },
    {
      name: "laptop",
      use: { channel: "msedge", viewport: { width: 1024, height: 768 }, storageState: ADMIN_STATE },
      dependencies: ["setup"],
      testMatch: /responsive\.spec\.ts/,
    },
    {
      name: "wide",
      use: { channel: "msedge", viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE },
      dependencies: ["setup"],
      testMatch: /responsive\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
