import { expect, test } from "../fixtures/test.js";
import { accounts } from "../support/accounts.js";
import { readVerificationLink } from "../support/mail.js";

test.describe("registro y acceso", () => {
  test("un estudio se registra, verifica su email y abre su dashboard", async ({ page }) => {
    const email = `e2e.registro.${Date.now()}@lumaflow.test`;

    await page.goto("/register");
    await page.getByLabel("Tu nombre").fill("Estudio Nuevo E2E");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("lumaflow-e2e");
    await page.getByLabel("Confirmar password").fill("lumaflow-e2e");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // El alta deja al estudio a la espera del enlace de verificacion.
    await expect(page).toHaveURL(/\/verify-email$/);
    await expect(page.getByRole("heading", { name: "Revisa tu bandeja de entrada" })).toBeVisible();

    // El backend usa el mailer `log`, asi que el enlace firmado queda en el log.
    await expect
      .poll(() => readVerificationLink(email), {
        message: "el backend deberia enviar el enlace de verificacion",
        timeout: 30_000,
      })
      .toMatch(/^https?:\/\/.+\/api\/email\/verify\/\d+\//);

    await page.goto(await readVerificationLink(email));

    // Verificar el email devuelve a la SPA, que continua con el onboarding.
    await page.waitForURL("**/onboarding");
    await page.getByLabel("Nombre del estudio").fill("Estudio Nuevo E2E");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Retrato", exact: true }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel("País").selectOption("ES");
    await page.getByLabel("Moneda").selectOption("EUR");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: /Entregar galerías a clientes/ }).click();
    await page.getByRole("button", { name: "Abrir mi estudio" }).click();

    await page.waitForURL("**/getting-started");
    await page.getByRole("button", { name: /Crear mi primer trabajo/ }).click();
    await page.waitForURL("**/app/jobs");

    await page.goto("/app/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    // El nombre del estudio aparece en la navegacion de la SPA ya configurada.
    await expect(page.getByRole("banner").getByText("Estudio Nuevo E2E")).toBeVisible();
  });

  test("un estudio ya configurado inicia sesion y llega a su dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(accounts.access.email);
    await page.getByLabel("Password", { exact: true }).fill("password incorrecta");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Las credenciales no son correctas.")).toBeVisible();

    await page.getByLabel("Password", { exact: true }).fill(accounts.access.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL("**/app/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});