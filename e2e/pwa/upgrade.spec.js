import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import {
  mkdtemp,
  readFile,
  readdir,
  symlink,
  unlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, extname, sep } from "node:path";
import { frontendDir, repoRoot } from "../support/env.js";

// Frozen pre-SEO source; never change branches or read a production session.
const legacyRef = "03676ea496b22d6538f4c2fcb0671bf6592e64ff";

test("an existing SPA worker updates to the SEO shell without losing local state", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const temporary = await mkdtemp(join(tmpdir(), "lumaflow-pwa-upgrade-"));
  let server;
  let context;
  try {
    const legacyDirectory =
      process.env.PWA_LEGACY_DIR || join(temporary, "dist");
    if (!process.env.PWA_LEGACY_DIR) {
      execFileSync(
        "git",
        [
          "archive",
          `${legacyRef}:frontend`,
          "--output",
          join(temporary, "source.tar"),
        ],
        { cwd: repoRoot },
      );
      execFileSync("tar", ["-xf", "source.tar"], { cwd: temporary });
      await symlink(
        join(frontendDir, "node_modules"),
        join(temporary, "node_modules"),
        process.platform === "win32" ? "junction" : "dir",
      );
      execFileSync(
        process.execPath,
        [join(frontendDir, "node_modules/vite/bin/vite.js"), "build"],
        {
          cwd: temporary,
          stdio: "pipe",
          timeout: 60_000,
        },
      );
    }
    let upgraded = false;
    const types = {
      ".js": "application/javascript",
      ".css": "text/css",
      ".html": "text/html",
      ".json": "application/json",
      ".webmanifest": "application/manifest+json",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    };
    server = createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url, "http://localhost").pathname;
        if (upgraded) {
          const upstream = await fetch(`http://127.0.0.1:5274${request.url}`, {
            redirect: "manual",
          });
          response.writeHead(
            upstream.status,
            Object.fromEntries(
              [...upstream.headers].filter(
                ([key]) =>
                  ![
                    "content-encoding",
                    "content-length",
                    "transfer-encoding",
                  ].includes(key),
              ),
            ),
          );
          response.end(Buffer.from(await upstream.arrayBuffer()));
          return;
        }
        const file = resolve(legacyDirectory, "." + pathname);
        if (
          !file.startsWith(resolve(legacyDirectory) + "/") &&
          !file.startsWith(resolve(legacyDirectory) + "\\")
        ) {
          response.writeHead(404).end();
          return;
        }
        let body = await readFile(file).catch(() => null);
        const extension = body ? extname(file) : ".html";
        body ??= await readFile(join(legacyDirectory, "index.html"));
        response.writeHead(200, {
          "Content-Type": types[extension] ?? "application/octet-stream",
          "Cache-Control": "no-store",
        });
        response.end(body);
      } catch {
        response.writeHead(500).end();
      }
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    const origin = `http://127.0.0.1:${server.address().port}`;
    context = await browser.newContext();
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    await page.goto(origin + "/login");
    await expect(
      page.getByRole("button", { name: "Entrar", exact: true }),
    ).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise((done) =>
          navigator.serviceWorker.addEventListener("controllerchange", done, {
            once: true,
          }),
        );
      localStorage.setItem("seo-upgrade-canary", "synthetic-local-state");
    });
    const oldCache = await page.evaluate(async () =>
      (
        await Promise.all(
          (await caches.keys()).map(async (name) =>
            (await (await caches.open(name)).keys()).map((r) => r.url),
          ),
        )
      ).flat(),
    );
    expect(oldCache.some((url) => url.includes("/index.html"))).toBe(true);
    expect(oldCache.some((url) => url.includes("/app-shell.html"))).toBe(false);
    upgraded = true;
    await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistration()).update(),
    );
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const urls = (
            await Promise.all(
              (await caches.keys()).map(async (name) =>
                (await (await caches.open(name)).keys()).map((r) => r.url),
              ),
            )
          ).flat();
          return urls.some((url) => url.includes("/app-shell.html"));
        }),
      )
      .toBe(true);
    // autoUpdate reloads the old client; wait for its new head instead of racing it.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(
      page.getByRole("button", { name: "Entrar", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("seo-upgrade-canary")),
    ).toBe("synthetic-local-state");
    const currentAssets = await readdir(join(frontendDir, "dist/assets"));
    const obsolete = oldCache.filter(
      (url) =>
        url.includes("/assets/") &&
        !currentAssets.includes(new URL(url).pathname.split("/").pop()),
    );
    expect(obsolete.length).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.evaluate(async (obsolete) => {
          const urls = (
            await Promise.all(
              (await caches.keys()).map(async (name) =>
                (await (await caches.open(name)).keys()).map((r) => r.url),
              ),
            )
          ).flat();
          return urls.filter(
            (url) =>
              obsolete.includes(url) ||
              new URL(url).pathname.startsWith("/api/"),
          );
        }, obsolete),
      )
      .toEqual([]);
    await context.setOffline(true);
    const navigation = await page.goto(origin + "/app/clients");
    const html = await navigation.text();
    expect(html).toContain('name="robots" content="noindex');
    expect(html).not.toContain('rel="canonical"');
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Entrar", exact: true }),
    ).toBeVisible();
  } finally {
    await context?.close();
    if (server) await new Promise((done) => server.close(done));
    // Remove the dependency junction first, never recurse into the real modules.
    if (
      !resolve(temporary).startsWith(
        resolve(tmpdir()) + sep + "lumaflow-pwa-upgrade-",
      )
    )
      throw new Error("Unsafe temporary directory");
    await unlink(join(temporary, "node_modules")).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
    await rm(temporary, { recursive: true, force: true });
  }
});
