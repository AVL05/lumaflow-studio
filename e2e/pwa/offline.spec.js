import { expect, test } from "@playwright/test";

test("production PWA installs and reloads offline without caching AI or API responses", async ({
  page,
  context,
}) => {
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === "http://127.0.0.1:5274"
      ? route.continue()
      : route.abort(),
  );
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
    }
  });
  const cached = await page.evaluate(async () => {
    const requests = await Promise.all(
      (await caches.keys()).map(async (name) =>
        (await caches.open(name)).keys(),
      ),
    );
    return requests.flat().map((request) => new URL(request.url).pathname);
  });
  expect(cached).toContain("/index.html");
  expect(cached).toContain("/app-shell.html");
  expect(cached.some((path) => path.endsWith(".css"))).toBe(true);
  expect(cached.some((path) => /\/lib-.*\.js$/.test(path))).toBe(false);
  expect(cached.some((path) => path.startsWith("/api/"))).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await page.goto("/support");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "LumaFlow seguirá siendo gratuito.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /^Apoyar en/ })).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      fetch("/api/synthetic-offline-canary").then(
        () => false,
        () => true,
      ),
    ),
  ).toBe(true);
});
