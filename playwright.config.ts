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
    { name: "desktop", use: { ...devices["Desktop Edge"], channel: "msedge" }, testIgnore: /mobile\.spec\.ts/ },
    {
      name: "phone",
      use: { channel: "msedge", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
      // Phone checks cover layout-specific flows only.
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
