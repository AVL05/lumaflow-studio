import { test, expect } from "@playwright/test";
import { publicPages, siteUrl } from "../../frontend/src/app/seo.js";

const origin = new URL(process.env.SEO_PREVIEW_URL).origin;
const headers = process.env.VERCEL_OIDC_TOKEN
  ? { "x-vercel-trusted-oidc-idp-token": process.env.VERCEL_OIDC_TOKEN }
  : {};

test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) return route.abort();
    return route.continue({
      headers: { ...route.request().headers(), ...headers },
    });
  });
});

for (const route of publicPages) {
  test(`preview HTML, hydration and SPA navigation: ${route.path}`, async ({
    page,
    request,
    browser,
  }) => {
    const response = await request.get(route.path, {
      headers,
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    // Vercel deliberately excludes Preview deployments from indexing.
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    const html = await response.text();
    expect(html).toMatch(/<h1[ >]/);
    expect(html).toContain(`rel="canonical" href="${siteUrl}${route.path}"`);
    expect(html).toContain(`content="${route.title}"`);
    expect(html).toContain(`content="${route.description}"`);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        /hydration|hydrating|didn't match|does not match|Minified React error/i.test(
          message.text(),
        )
      ) {
        errors.push(message.text());
      }
    });
    await page.goto(route.path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      siteUrl + route.path,
    );
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL(origin + "/register");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await page.goBack();
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    expect(errors).toEqual([]);

    const noJs = await browser.newContext({ javaScriptEnabled: false });
    try {
      await noJs.route("**/*", (r) =>
        new URL(r.request().url()).origin === origin
          ? r.continue({ headers: { ...r.request().headers(), ...headers } })
          : r.abort(),
      );
      const document = await noJs.newPage();
      await document.goto(origin + route.path);
      await expect(document.locator("h1")).toBeVisible();
      await expect(
        document.locator('a[href="/register"]').first(),
      ).toBeVisible();
    } finally {
      await noJs.close();
    }
  });
}

test("preview robots, sitemap, redirects, private shell and real 404", async ({
  request,
}) => {
  const get = (path) => request.get(path, { headers, maxRedirects: 0 });
  const robots = await get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
  const sitemap = await get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("xml");
  expect(
    [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)]
      .map((m) => m[1])
      .sort(),
  ).toEqual(publicPages.map((p) => siteUrl + p.path).sort());
  for (const [path, target] of [
    ["/index.html", "/"],
    ["/features/", "/features"],
    ["/security", "/privacy"],
  ]) {
    const response = await get(path);
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(target);
  }
  for (const path of [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/app/clients",
    "/deliver/seo-synthetic-invalid",
    "/contract/seo-synthetic-invalid",
    "/book/seo-synthetic-invalid",
    "/?token=seo-synthetic-invalid",
  ]) {
    const response = await get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    const html = await response.text();
    expect(html).toContain('name="robots" content="noindex');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain("seo-synthetic-invalid");
    expect(html).toContain('<div id="root"></div>');
  }
  for (const path of [
    "/seo-unknown",
    "/assets/seo-missing.js",
    "/api/seo-missing?token=synthetic",
  ]) {
    expect((await get(path)).status()).toBe(404);
  }
});
