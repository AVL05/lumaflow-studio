import { defineConfig, devices } from "@playwright/test";
import { apiUrl, e2eDir, frontendDir, frontendUrl } from "./support/env.js";

const apiOrigin = apiUrl.replace(/\/api$/, "");
const frontendPort = new URL(frontendUrl).port;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./support/global-setup.js",
  outputDir: "./test-results",
  // La suite comparte una base SQLite de test: se ejecuta en serie para que los
  // tests no compitan por la misma base.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: frontendUrl,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node scripts/start-backend.mjs",
      cwd: e2eDir,
      url: `${apiOrigin}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      cwd: frontendDir,
      env: { VITE_API_URL: apiUrl },
      url: `${frontendUrl}/`,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});