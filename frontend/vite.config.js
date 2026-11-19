import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";
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

// Subida de source maps a Sentry (#62): solo con credenciales y una release conocida, para que
// el stack de produccion sea legible. Sin ellas el build no genera mapas y funciona igual.
const uploadSourceMaps = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT &&
  appRelease,
);

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
  build: {
    // `hidden`: los mapas se suben a Sentry y se borran tras la subida; nunca se sirven al publico.
    sourcemap: uploadSourceMaps ? "hidden" : false,
    // Only the WebLLM chunk (lib-*, ~6 MB, loaded on demand by the local-AI feature and kept out
    // of the PWA precache) exceeds this. Everything else is held by `pnpm run check:bundle`.
    chunkSizeWarningLimit: 6500,
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
    uploadSourceMaps &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: { name: appRelease },
        sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
        telemetry: false,
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
