import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

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
    // Everything except the phone-only specs, at 1280×720 (responsive.spec.ts included).
    { name: "desktop", use: { ...devices["Desktop Edge"], channel: "msedge" }, testIgnore: /mobile\.spec\.ts/ },
    // Layout checks at the widths docs/design.md targets (docs/plans/2026-10-22-responsif.md).
    {
      name: "phone-320",
      use: { channel: "msedge", viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true },
      testMatch: /(mobile|responsive)\.spec\.ts/,
    },
    {
      name: "phone",
      use: { channel: "msedge", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
      testMatch: /(mobile|responsive)\.spec\.ts/,
    },
    {
      name: "tablet",
      use: { channel: "msedge", viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true },
      testMatch: /responsive\.spec\.ts/,
    },
    { name: "laptop", use: { channel: "msedge", viewport: { width: 1024, height: 768 } }, testMatch: /responsive\.spec\.ts/ },
    { name: "wide", use: { channel: "msedge", viewport: { width: 1440, height: 900 } }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
