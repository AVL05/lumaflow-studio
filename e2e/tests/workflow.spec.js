import { expect, test } from "../fixtures/test.js";

test.describe("alta de cliente, trabajo y sesion", () => {
  test("el recorrido comercial crea cliente, trabajo y sesion", async ({ ownerPage }) => {
    const suffix = Date.now();
    const clientName = `Cliente E2E ${suffix}`;
    const jobTitle = `Boda E2E ${suffix}`;
    const sessionName = `Preboda E2E ${suffix}`;
    const eventDate = "2030-05-17";

    await ownerPage.goto("/app/clients");
    await ownerPage.getByRole("button", { name: "Nuevo cliente" }).click();

    const clientDialog = ownerPage.getByRole("dialog");
    await clientDialog.getByLabel("Nombre", { exact: true }).fill(clientName);
    await clientDialog.getByLabel("Email", { exact: true }).fill(`cliente.${suffix}@lumaflow.test`);
    await clientDialog.getByRole("button", { name: "Guardar cliente" }).click();

    await expect(clientDialog).toBeHidden();
    await expect(ownerPage.getByRole("heading", { name: clientName })).toBeVisible();

    // El trabajo se enlaza con el cliente creado: el pipeline queda completo.
    await ownerPage.goto("/app/jobs");
    await ownerPage.getByRole("button", { name: "Nuevo trabajo" }).click();

    const jobDialog = ownerPage.getByRole("dialog");
    await jobDialog.getByLabel("Nombre del trabajo").fill(jobTitle);
    // Esperar a que el fetch de clientes de /app/jobs incluya el recien creado
    // antes de seleccionar: evita mandar client_id vacio si el dialogo se abrio
    // con la lista aun cargando.
    const jobClientSelect = jobDialog.getByLabel("Cliente");
    await expect(jobClientSelect.locator("option", { hasText: clientName })).toBeAttached();
    await jobClientSelect.selectOption({ label: clientName });
    await expect(jobClientSelect).not.toHaveValue("");
    await jobDialog.getByLabel("Fecha").fill(eventDate);
    // El `label` envuelve el `select`, asi que su nombre accesible incluye las
    // opciones: se ancla el inicio para no confundirse con "Workflow".
    await jobDialog.getByLabel(/^Especialidad/).selectOption("wedding");
    await jobDialog.getByLabel("Presupuesto").fill("1500");
    await jobDialog.getByRole("button", { name: "Crear trabajo" }).click();

    await expect(jobDialog).toBeHidden();

    const jobCard = ownerPage.getByRole("link", { name: new RegExp(jobTitle) });
    await expect(jobCard).toBeVisible();
    await expect(jobCard.getByText(clientName, { exact: true })).toBeVisible();

    await ownerPage.goto("/app/sessions");
    await ownerPage.getByRole("button", { name: "Nueva sesion" }).click();

    const sessionDialog = ownerPage.getByRole("dialog");
    await sessionDialog.getByLabel("Nombre", { exact: true }).fill(sessionName);
    await sessionDialog.getByLabel("Cliente", { exact: true }).fill(clientName);
    await sessionDialog.getByLabel("Fecha", { exact: true }).fill(eventDate);
    await sessionDialog.getByLabel("Hora").fill("17:30");
    await sessionDialog.getByLabel("Localizacion", { exact: true }).fill("Jardin Botanico E2E");
    await sessionDialog.getByRole("button", { name: "Guardar sesion" }).click();

    await expect(sessionDialog).toBeHidden();

    const sessionCard = ownerPage.getByRole("heading", { name: sessionName });
    await expect(sessionCard).toBeVisible();
    await expect(ownerPage.getByText(`${clientName} · Jardin Botanico E2E`)).toBeVisible();
  });
});