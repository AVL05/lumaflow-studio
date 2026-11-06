import { defineConfig, devices } from "@playwright/test";
import { frontendDir } from "./support/env.js";

export default defineConfig({
  testDir: "./pwa",
  outputDir: "./test-results/pwa",
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5274",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5274 --strictPort",
    cwd: frontendDir,
    url: "http://127.0.0.1:5274",
    reuseExistingServer: false,
  },
});
