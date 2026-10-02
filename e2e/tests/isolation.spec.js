import { expect, test } from "../fixtures/test.js";
import { apiRequest, findResourceId } from "../support/app.js";

test.describe("aislamiento entre estudios", () => {
  test("un estudio no alcanza los clientes de otro estudio", async ({ ownerPage, outsiderPage }) => {
    const clientName = `Cliente Privado E2E ${Date.now()}`;

    await ownerPage.goto("/app/clients");
    await ownerPage.getByRole("button", { name: "Nuevo cliente" }).click();

    const clientDialog = ownerPage.getByRole("dialog");
    await clientDialog.getByLabel("Nombre", { exact: true }).fill(clientName);
    await clientDialog.getByRole("button", { name: "Guardar cliente" }).click();
    await expect(clientDialog).toBeHidden();

    const clientId = await findResourceId(ownerPage, "/clients", "name", clientName);

    // La API responde 404 (no 403) para que no revele que el recurso existe.
    const read = await apiRequest(outsiderPage, "GET", `/clients/${clientId}`);
    expect(read.status()).toBe(404);
    expect(await read.text()).not.toContain(clientName);

    // El payload es valido a proposito: un 422 de validacion enmascararia el
    // fallo de autorizacion, que es lo que este test debe comprobar.
    const update = await apiRequest(outsiderPage, "PATCH", `/clients/${clientId}`, {
      name: "Secuestrado E2E",
      status: "active",
    });
    expect(update.status()).toBe(404);
    expect(await update.text()).not.toContain(clientName);

    const remove = await apiRequest(outsiderPage, "DELETE", `/clients/${clientId}`);
    expect(remove.status()).toBe(404);

    // El cliente ajeno tampoco aparece en el listado del segundo estudio.
    const list = await apiRequest(outsiderPage, "GET", "/clients?per_page=100");
    expect(list.status()).toBe(200);
    expect(await list.text()).not.toContain(clientName);

    // Ni en la interfaz: la ruta directa no filtra datos ni mensajes de existencia.
    await outsiderPage.goto(`/app/clients/${clientId}`);
    await expect(outsiderPage.getByText(clientName)).toHaveCount(0);
    await expect(outsiderPage.getByRole("heading", { name: "Detalle de cliente" })).toBeVisible();

    // El propietario conserva el acceso a su propio recurso.
    const ownerRead = await apiRequest(ownerPage, "GET", `/clients/${clientId}`);
    expect(ownerRead.status()).toBe(200);
  });
});
