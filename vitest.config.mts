import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // e2e/*.spec.ts are Playwright tests, run with `npm run test:e2e`.
    include: ["__tests__/**/*.test.{ts,tsx}"],
  },
});
