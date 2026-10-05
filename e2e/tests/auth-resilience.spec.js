import { expect, test } from "../fixtures/test.js";
import { apiRequest } from "../support/app.js";

test.describe("resiliencia de sesion", () => {
  test("un 500 en /user muestra degradado con retry y recupera sin login", async ({
    ownerPage,
  }) => {
    await ownerPage.goto("/app/dashboard");
    await expect(ownerPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // El backend falla de forma transitoria solo en el navegador.
    await ownerPage.route("**/api/user", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error interno." }),
      }),
    );
    await ownerPage.reload();

    await expect(ownerPage.getByText("Sin conexión con el servidor")).toBeVisible();
    await expect(ownerPage.getByRole("button", { name: "Reintentar" })).toBeVisible();
    await expect(ownerPage).not.toHaveURL(/\/login$/);

    const token = await ownerPage.evaluate(() => window.localStorage.getItem("lumaflow_token"));
    expect(token, "el token se conserva ante un 500").toBeTruthy();

    // Al recuperarse, el reintento entra sin pedir credenciales.
    await ownerPage.unroute("**/api/user");
    await ownerPage.getByRole("button", { name: "Reintentar" }).click();
    await expect(ownerPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(ownerPage).not.toHaveURL(/\/login$/);
  });

  test("un 401 en /user limpia la sesion y pide login", async ({ ownerPage }) => {
    await ownerPage.goto("/app/dashboard");
    await expect(ownerPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await ownerPage.route("**/api/user", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthenticated." }),
      }),
    );
    await ownerPage.reload();

    await expect(ownerPage).toHaveURL(/\/login$/);
    const token = await ownerPage.evaluate(() => window.localStorage.getItem("lumaflow_token"));
    expect(token, "el token invalido se elimina").toBeNull();
  });

  test("el token real sigue siendo valido tras el modo degradado", async ({ ownerPage }) => {
    const response = await apiRequest(ownerPage, "GET", "/user");
    expect(response.status()).toBe(200);
  });
});
