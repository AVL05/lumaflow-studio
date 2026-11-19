import { defineConfig, devices } from "@playwright/test";
import { frontendDir } from "./support/env.js";

export default defineConfig({
  testDir: "./support-tests",
  outputDir: "./test-results/support",
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5275",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5275 --strictPort --no-open",
    cwd: frontendDir,
    url: "http://127.0.0.1:5275",
    reuseExistingServer: false,
    env: {
      VITE_API_URL: "http://127.0.0.1:9/api",
      VITE_SENTRY_DSN: "",
      // Synthetic destinations only for this isolated dev server; never use in a production build.
      VITE_KOFI_URL: "https://ko-fi.com/lfsynthetic00000000000001",
      VITE_GITHUB_SPONSORS_URL:
        "https://github.com/sponsors/lf-synthetic-00000000000001",
    },
  },
});
