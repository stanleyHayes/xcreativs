import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",
    headless: true,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Start the dev server for local/CI runs unless E2E_BASE_URL points elsewhere.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        port: 3001,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
