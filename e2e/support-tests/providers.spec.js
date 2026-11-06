import { expect, test } from "@playwright/test";

test("two providers work with keyboard and mobile without third-party JavaScript or donor storage", async ({
  page,
  context,
}) => {
  const requests = [];
  const referrers = [];
  context.on("request", (request) => requests.push(request.url()));
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:5275") return route.continue();
    if (["ko-fi.com", "github.com"].includes(url.hostname)) {
      referrers.push(route.request().headers()["referer"]);
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<title>Synthetic provider, no payment</title>",
      });
    }
    return route.abort();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/support");
  const links = page.getByRole("link", { name: /^Apoyar en/ });
  await expect(links).toHaveCount(2);
  expect(
    requests.every((url) => new URL(url).origin === "http://127.0.0.1:5275"),
  ).toBe(true);
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Saltar al contenido" }),
  ).toBeFocused();
  for (const name of ["Ko-fi", "GitHub Sponsors"]) {
    const link = page.getByRole("link", {
      name: `Apoyar en ${name} (nueva pestaña)`,
    });
    await link.focus();
    const popupPromise = context.waitForEvent("page");
    await page.keyboard.press("Enter");
    const popup = await popupPromise;
    await popup.waitForLoadState();
    await expect(popup).toHaveTitle("Synthetic provider, no payment");
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    await popup.close();
  }
  expect(referrers).toEqual([undefined, undefined]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../docs/screenshots/sprint6-support-configured-mobile.png",
    fullPage: true,
  });
});
