import { expect, test } from "@playwright/test";
import { publicPages, siteUrl } from "../../frontend/src/app/seo.js";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";

test("precache revisions match final HTML and only public documents are rendered", async () => {
  const dist = new URL("../../frontend/dist/", import.meta.url);
  const files = (await readdir(dist))
    .filter((name) => name.endsWith(".html"))
    .sort();
  expect(files).toEqual([
    "404.html",
    "about-project.html",
    "app-shell.html",
    "features.html",
    "index.html",
    "pricing.html",
    "privacy.html",
    "support.html",
  ]);
  const worker = await readFile(new URL("sw.js", dist), "utf8");
  for (const file of files) {
    const bytes = await readFile(new URL(file, dist));
    const hash = createHash("md5").update(bytes).digest("hex");
    expect(worker).toContain(`url:"${file}",revision:"${hash}"`);
  }
  const html = await readFile(new URL("index.html", dist), "utf8");
  const data = JSON.parse(
    html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1],
  );
  expect(data["@graph"][1].offers.price).toBe("0");
  expect(JSON.stringify(data)).not.toMatch(
    /aggregateRating|ratingCount|review|PRIVATE_CANARY/,
  );
});

for (const route of publicPages) {
  test(`commercial HTML and hydration: ${route.path}`, async ({
    page,
    context,
    request,
    browser,
  }) => {
    const response = await request.get(route.path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    const html = await response.text();
    expect(html).toMatch(/<h1[ >]/);
    expect(html).toContain(`href="${siteUrl}${route.path}"`);
    expect(html).toContain(`content="${route.title}"`);
    expect(html).not.toContain("PRIVATE_CANARY");
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        /hydration|hydrating|didn't match|does not match/i.test(message.text())
      )
        errors.push(message.text());
    });
    const outbound = [];
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== "http://127.0.0.1:5274") {
        outbound.push(url.origin);
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(route.path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      siteUrl + route.path,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      siteUrl + route.path,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /^https:\/\//,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow",
    );
    // Clicking the CTA verifies that React attached to the existing public markup.
    await page
      .getByRole("link", { name: "Empezar gratis", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveTitle(route.title);
    expect(errors).toEqual([]);
    expect(outbound).toEqual([]);
    const noScript = await browser.newContext({
      javaScriptEnabled: false,
      serviceWorkers: "block",
    });
    try {
      const visiblePage = await noScript.newPage();
      await visiblePage.goto("http://127.0.0.1:5274" + route.path);
      await expect(visiblePage.locator("h1")).toHaveCount(1);
      await expect(
        visiblePage
          .getByRole("link", { name: "Empezar gratis", exact: true })
          .first(),
      ).toBeVisible();
    } finally {
      await noScript.close();
    }
  });
}

test("robots, sitemap, redirects, real 404s and private shells", async ({
  request,
  page,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.headers()["content-type"]).toMatch(/xml/);
  const xml = await sitemap.text();
  expect(
    await page.evaluate(
      (source) =>
        new DOMParser()
          .parseFromString(source, "application/xml")
          .querySelector("parsererror")?.textContent ?? null,
      xml,
    ),
  ).toBeNull();
  expect(
    [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]),
  ).toEqual(publicPages.map((route) => siteUrl + route.path));
  for (const [path, destination] of [
    ["/security", "/privacy"],
    ["/index.html", "/"],
    ["/features/", "/features"],
    ["/features.html", "/features"],
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(destination);
  }
  for (const path of [
    "/unknown-seo-test",
    "/assets/missing.js",
    "/api/synthetic",
    "/unknown-seo-test?token=SECRET",
    "/assets/missing.js?token=SECRET",
    "/api/synthetic?token=SECRET",
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  expect(
    (await request.get("/robots.txt?token=SECRET")).headers()["content-type"],
  ).toContain("text/plain");
  for (const path of [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password?token=SECRET",
    "/verify-email",
    "/onboarding",
    "/getting-started",
    "/demo",
    "/app/clients",
    "/deliver/SECRET",
    "/contract/SECRET",
    "/book/SECRET",
    "/?token=SECRET",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    const html = await response.text();
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain("SECRET");
    expect(html).not.toContain("data-prerendered");
    expect(html).toContain("noindex");
  }
  await page.goto("/?token=SECRET");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("commercial content and CTAs remain usable at desktop, tablet and mobile widths", async ({
  page,
}, testInfo) => {
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Empezar gratis", exact: true })
        .first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`home-${width}.png`),
      fullPage: true,
    });
  }
});
