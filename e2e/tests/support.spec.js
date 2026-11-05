import { expect, test } from "../fixtures/test.js";
import { frontendUrl } from "../support/env.js";

test("support remains public, optional and reachable from mobile footer and settings", async ({
  page,
  ownerPage,
}) => {
  const providerRequests = [];
  page.on("request", (request) => {
    if (["ko-fi.com", "github.com"].includes(new URL(request.url()).hostname))
      providerRequests.push(request.url());
  });
  await page.route("**/*", (route) =>
    route.request().resourceType() === "script" &&
    new URL(route.request().url()).origin !== new URL(frontendUrl).origin
      ? route.abort()
      : route.continue(),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pricing");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Apoyar LumaFlow" })
    .click();
  await expect(page).toHaveURL(/\/support$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "LumaFlow seguirá siendo gratuito.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /^Apoyar en/ })).toHaveCount(0);
  await expect(
    page.getByText(/Los canales de apoyo todavía no están disponibles/),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Las mismas funciones para todos" }),
  ).toContainText("Sin planes premium");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../docs/screenshots/sprint6-support-mobile.png",
    fullPage: true,
  });
  expect(providerRequests).toEqual([]);
  await ownerPage.goto("/app/settings");
  await ownerPage.getByRole("link", { name: "Apoyar LumaFlow" }).click();
  await expect(ownerPage).toHaveURL(/\/support$/);
  await expect(ownerPage.getByRole("heading", { level: 1 })).toHaveText(
    "LumaFlow seguirá siendo gratuito.",
  );
  expect(
    await ownerPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await ownerPage.screenshot({
    path: "../docs/screenshots/sprint6-support-desktop.png",
    fullPage: true,
  });
});
