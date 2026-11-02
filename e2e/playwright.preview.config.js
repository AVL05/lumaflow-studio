import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.SEO_PREVIEW_URL;
if (
  !baseURL ||
  new URL(baseURL).protocol !== "https:" ||
  !new URL(baseURL).hostname.endsWith(".vercel.app")
) {
  throw new Error(
    "SEO_PREVIEW_URL must identify the exact Vercel preview deployment",
  );
}

export default defineConfig({
  testDir: "./preview",
  outputDir: "./test-results/preview",
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    serviceWorkers: "block",
    // Authentication headers must never appear in saved traces.
    trace: "off",
    screenshot: "off",
  },
});
