import { expect, test } from "../fixtures/test.js";
import { apiRequest, findResourceId } from "../support/app.js";

test.describe("portal de entrega", () => {
  test("el cliente aprueba la entrega desde el enlace publico", async ({ ownerPage, visitorPage }) => {
    const suffix = Date.now();
    const clientName = `Cliente Entrega E2E ${suffix}`;
    const deliveryTitle = `Galería Boda E2E ${suffix}`;

    await ownerPage.goto("/app/clients");
    await ownerPage.getByRole("button", { name: "Nuevo cliente" }).click();

    const clientDialog = ownerPage.getByRole("dialog");
    await clientDialog.getByLabel("Nombre", { exact: true }).fill(clientName);
    await clientDialog.getByRole("button", { name: "Guardar cliente" }).click();
    await expect(clientDialog).toBeHidden();

    await ownerPage.goto("/app/deliveries");
    await ownerPage.getByRole("button", { name: "Nueva entrega" }).click();

    const deliveryDialog = ownerPage.getByRole("dialog");
    await deliveryDialog.getByLabel("Titulo").fill(deliveryTitle);
    // El `label` envuelve el `select`, asi que su nombre accesible incluye las
    // opciones: se ancla el inicio para no confundirse con "Estado de pago".
    await deliveryDialog.getByLabel(/^Estado(?!\s)/).selectOption("delivered");
    await deliveryDialog.getByLabel("Cliente").selectOption({ label: clientName });
    await deliveryDialog.getByLabel("Presupuesto", { exact: true }).fill("1200");
    await deliveryDialog.getByLabel("Importe pagado").fill("1200");
    await deliveryDialog.getByLabel("Estado de pago").selectOption("paid");
    await deliveryDialog.getByLabel("URL de la galería").fill("https://example.com/galeria-e2e");
    await deliveryDialog.getByLabel("Proveedor").fill("Pixieset");
    await deliveryDialog
      .getByLabel("Notas privadas")
      .fill("Ajuste de color pendiente de revisar antes de publicar.");
    await deliveryDialog.getByRole("button", { name: "Guardar entrega" }).click();

    await expect(deliveryDialog).toBeHidden();
    await expect(ownerPage.getByText(deliveryTitle)).toBeVisible();

    // El enlace publico no se expone en la UI: se lee el token como el estudio.
    const deliveryId = await findResourceId(ownerPage, "/deliveries", "title", deliveryTitle);
    const detail = await apiRequest(ownerPage, "GET", `/deliveries/${deliveryId}`);
    expect(detail.status()).toBe(200);

    const { public_token: publicToken } = (await detail.json()).data;
    expect(publicToken, "la entrega debe exponer un token publico").toBeTruthy();

    // El visitante abre el portal sin sesion y aprueba la entrega.
    await visitorPage.goto(`/deliver/${publicToken}`);

    await expect(visitorPage.getByRole("heading", { name: clientName })).toBeVisible();
    await expect(visitorPage.getByRole("link", { name: "Ver fotografías" })).toHaveAttribute(
      "href",
      "https://example.com/galeria-e2e",
    );
    // El portal muestra los datos de la entrega y no expone notas internas.
    await expect(visitorPage.getByText("Presupuesto")).toBeVisible();
    await expect(visitorPage.getByText("Estado de pago")).toBeVisible();
    await expect(
      visitorPage.getByText("Ajuste de color pendiente de revisar antes de publicar."),
    ).toHaveCount(0);

    await visitorPage.getByRole("button", { name: "Aprobar entrega" }).click();
    await expect(visitorPage.getByText("Ya has aprobado esta entrega. Gracias.")).toBeVisible();

    // La aprobacion queda registrada en el panel del estudio.
    await expect(ownerPage.reload()).toBeTruthy();
    const refreshed = await apiRequest(ownerPage, "GET", `/deliveries/${deliveryId}`);
    expect((await refreshed.json()).data.status).toBe("approved");
    const card = ownerPage.getByRole("article").filter({ hasText: deliveryTitle });
    await expect(card.getByRole("heading", { name: deliveryTitle })).toBeVisible();
    await expect(card.getByText("Aprobado", { exact: true })).toBeVisible();
  });
});
