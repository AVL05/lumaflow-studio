import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { VitePWA } from "vite-plugin-pwa";
import { publicSeo } from "./scripts/publicSeo.mjs";

// https://vite.dev/config/
// Release para observabilidad: commit del proveedor cuando existe
// (Vercel, GitHub Actions), 'unknown' como fallback honesto.
const appRelease =
  process.env.VITE_SENTRY_RELEASE ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.RENDER_GIT_COMMIT ||
  "";

// Content hash of the marketing screenshots: URLs change when a screenshot is regenerated under
// the same name, so the PWA's CacheFirst image cache never serves a stale one (see productImage.js).
const productDir = new URL("./public/product/", import.meta.url);
const productImagesVersion = createHash("sha1")
  .update(
    readdirSync(productDir)
      .sort()
      .map((name) => name + readFileSync(new URL(name, productDir)).toString("base64"))
      .join(""),
  )
  .digest("hex")
  .slice(0, 8);

export default defineConfig({
  define: {
    __APP_RELEASE__: JSON.stringify(appRelease),
    __PRODUCT_IMAGES_VERSION__: JSON.stringify(productImagesVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    publicSeo(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32x32.png", "apple-touch-icon.png"],
      manifest: {
        name: "LumaFlow Studio",
        short_name: "LumaFlow",
        description: "Gestión integral para fotógrafos y estudios en una beta pública gratuita.",
        theme_color: "#090908",
        background_color: "#090908",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globIgnores: ["**/lib-*.js"],
        navigateFallback: "/app-shell.html",
        navigateFallbackAllowlist: [
          /^\/(?:app(?:\/.*)?|login|register|forgot-password|reset-password|verify-email|onboarding|getting-started|demo|deliver\/[^/?]+|contract\/[^/?]+|book\/[^/?]+)\/?(?:\?.*)?$/,
        ],
        navigateFallbackDenylist: [/^\/api(?:\/|$)/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "lumaflow-images",
              expiration: { maxEntries: 120, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    include: ["src/**/*.test.{js,jsx}"],
    // The first test of heavy page suites pays the cold import of lazy routes;
    // on loaded 2-core CI runners that exceeded the 5 s default (CI run
    // 42045414965) while taking <1 s locally. Assertions are unchanged.
    testTimeout: 15000,
    coverage: {
      reporter: ["text", "html"],
      include: ["src/hooks/**", "src/features/**", "src/components/**"],
    },
  },
});
