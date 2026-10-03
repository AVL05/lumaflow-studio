import { expect, test } from "../fixtures/test.js";
import { apiRequest } from "../support/app.js";

async function activationSteps(page) {
  const response = await apiRequest(page, "GET", "/dashboard");
  expect(response.status(), "el panel deberia responder 200").toBe(200);

  const steps = (await response.json()).data.activation.steps;
  return Object.fromEntries(steps.map((step) => [step.key, step]));
}

test.describe("primer valor", () => {
  test("un estudio nuevo configura, crea cliente, trabajo y sesion guiado por el CTA", async ({
    newcomerPage,
  }) => {
    const suffix = Date.now();
    const clientName = `Cliente Nuevo E2E ${suffix}`;
    const jobTitle = `Boda Nueva E2E ${suffix}`;
    const sessionName = `Preboda Nueva E2E ${suffix}`;

    // El embudo continua donde lo dejo la sesion preparada: paso 1 de 5.
    await expect(newcomerPage.getByText("1 de 5")).toBeVisible();
    await newcomerPage.getByLabel("Nombre del estudio").fill("Estudio Nuevo E2E");
    await newcomerPage.getByRole("button", { name: "Continuar" }).click();

    // Las especialidades son opcionales: se avanza sin elegir.
    await expect(newcomerPage.getByText("2 de 5")).toBeVisible();
    await newcomerPage.getByRole("button", { name: "Continuar" }).click();

    await expect(newcomerPage.getByText("3 de 5")).toBeVisible();
    await newcomerPage.getByRole("button", { name: "Continuar" }).click();

    await newcomerPage.getByRole("button", { name: /Entregar galerías a clientes/ }).click();
    await newcomerPage.getByRole("button", { name: "Abrir mi estudio" }).click();

    // Ultimo paso del embudo con ruta directa al primer trabajo.
    await newcomerPage.waitForURL("**/getting-started");
    await expect(newcomerPage.getByText("5 de 5")).toBeVisible();
    await newcomerPage.getByRole("button", { name: /Crear mi primer trabajo/ }).click();
    await newcomerPage.waitForURL("**/app/jobs");
    await expect(newcomerPage.getByText("Aún no tienes trabajos")).toBeVisible();

    // El panel orienta con la siguiente accion util.
    await newcomerPage.goto("/app/dashboard");
    const firstCta = newcomerPage.getByRole("link", { name: /primer cliente/i }).first();
    await expect(firstCta).toBeVisible();
    await firstCta.click();
    await newcomerPage.waitForURL("**/app/clients");

    await newcomerPage.getByRole("button", { name: "Nuevo cliente" }).click();
    const clientDialog = newcomerPage.getByRole("dialog");
    await clientDialog.getByLabel("Nombre", { exact: true }).fill(clientName);
    await clientDialog.getByRole("button", { name: "Guardar cliente" }).click();
    await expect(clientDialog).toBeHidden();
    await expect(newcomerPage.getByRole("heading", { name: clientName })).toBeVisible();

    let steps = await activationSteps(newcomerPage);
    expect(steps.client.completed, "el cliente real completa su paso").toBe(true);
    expect(steps.job.completed, "sin trabajo el paso sigue pendiente").toBe(false);

    await newcomerPage.goto("/app/dashboard");
    await expect(newcomerPage.getByRole("link", { name: /primer trabajo/i }).first()).toBeVisible();

    await newcomerPage.goto("/app/jobs");
    await newcomerPage.getByRole("button", { name: "Nuevo trabajo" }).click();
    const jobDialog = newcomerPage.getByRole("dialog");
    await jobDialog.getByLabel("Nombre del trabajo").fill(jobTitle);
    const jobClientSelect = jobDialog.getByLabel("Cliente");
    await expect(jobClientSelect.locator("option", { hasText: clientName })).toBeAttached();
    await jobClientSelect.selectOption({ label: clientName });
    await expect(jobClientSelect).not.toHaveValue("");
    await jobDialog.getByLabel("Fecha").fill("2030-05-17");
    await jobDialog.getByLabel(/^Especialidad/).selectOption("wedding");
    await jobDialog.getByLabel("Presupuesto").fill("1500");
    await jobDialog.getByRole("button", { name: "Crear trabajo" }).click();
    await expect(jobDialog).toBeHidden();

    await newcomerPage.goto("/app/sessions");
    await newcomerPage.getByRole("button", { name: "Nueva sesion" }).click();
    const sessionDialog = newcomerPage.getByRole("dialog");
    await sessionDialog.getByLabel("Nombre", { exact: true }).fill(sessionName);
    await sessionDialog.getByLabel("Cliente", { exact: true }).fill(clientName);
    await sessionDialog.getByLabel("Fecha", { exact: true }).fill("2030-05-17");
    await sessionDialog.getByLabel("Hora").fill("17:30");
    await sessionDialog.getByLabel("Localizacion", { exact: true }).fill("Jardin E2E");
    await sessionDialog.getByRole("button", { name: "Guardar sesion" }).click();
    await expect(sessionDialog).toBeHidden();
    await expect(newcomerPage.getByRole("heading", { name: sessionName })).toBeVisible();

    steps = await activationSteps(newcomerPage);
    expect(steps.job.completed, "el trabajo real completa su paso").toBe(true);
    expect(steps.session.completed, "la sesion real completa su paso").toBe(true);

    await newcomerPage.goto("/app/dashboard");
    await expect(newcomerPage.getByText("Primeros pasos · 4/5")).toBeVisible();

    // Viewport movil: sin overflow horizontal y con el CTA al alcance.
    await newcomerPage.setViewportSize({ width: 390, height: 844 });
    await newcomerPage.goto("/app/clients");
    await expect(newcomerPage.getByRole("button", { name: "Nuevo cliente" })).toBeVisible();
    const overflow = await newcomerPage.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
    expect(overflow, "sin desplazamiento horizontal en movil").toBeLessThanOrEqual(1);
  });
});
