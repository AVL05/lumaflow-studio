import { expect, test } from "../fixtures/test.js";
import { apiRequest, findResourceId } from "../support/app.js";
import { apiUrl } from "../support/env.js";

test.describe("portal de entrega", () => {
  test("versiones personales, recepción, cambios y revocación preservan el historial", async ({ ownerPage, visitorPage }) => {
    await ownerPage.goto("/app/deliveries");
    const title = `Entrega personal ${Date.now()}`;
    const created = await apiRequest(ownerPage, "POST", "/deliveries", {
      title, status: "delivered", client_id: null,
      gallery_url: "https://example.com/synthetic-first",
      private_notes: "PRIVATE_DELIVERY_CANARY",
    });
    expect(created.status()).toBe(201);
    const delivery = (await created.json()).data;
    await ownerPage.goto(`/app/deliveries/${delivery.id}`);
    await ownerPage.getByRole("button", { name: "Nueva revisión" }).click();
    await ownerPage.getByLabel("Enlace HTTPS de la revisión").fill("https://vimeo.com/123456");
    await ownerPage.getByLabel("Notas para el destinatario").fill("Synthetic second cut");
    await ownerPage.getByRole("button", { name: "Previsualizar revisión" }).click();
    await ownerPage.getByRole("button", { name: "Confirmar publicación" }).click();
    await expect(ownerPage.getByRole("status")).toContainText("Revisión 2");
    await visitorPage.setViewportSize({ width: 390, height: 844 });
    await visitorPage.goto(`/deliver/${delivery.public_token}`);
    await expect(visitorPage.getByRole("heading", { name: title })).toBeVisible();
    await expect(visitorPage.getByText("PRIVATE_DELIVERY_CANARY")).toHaveCount(0);
    await expect(visitorPage.getByRole("link", { name: "Abrir revisión 1" })).toHaveAttribute("href", "https://example.com/synthetic-first");
    await visitorPage.getByRole("button", { name: "Confirmar recepción" }).click();
    await expect(visitorPage.getByRole("status")).toContainText("Recibida");
    await visitorPage.getByRole("button", { name: "Iniciar revisión" }).click();
    await expect(visitorPage.getByRole("status")).toContainText("En revisión");
    await visitorPage.getByRole("button", { name: "Pedir cambios" }).click();
    await visitorPage.getByLabel("Que te gustaria cambiar?").fill("Synthetic adjustment for version two");
    await visitorPage.getByRole("button", { name: "Enviar mensaje" }).click();
    await expect(visitorPage.getByRole("status")).toContainText("Cambios solicitados");
    const stale = await visitorPage.request.post(`${apiUrl}/public/deliveries/${delivery.public_token}/approve`, { data: { revision_number: 1 } });
    expect(stale.status()).toBe(409);
    await visitorPage.getByRole("button", { name: "Aprobar entrega" }).click();
    await expect(visitorPage.getByText("Ya has aprobado esta entrega. Gracias.")).toBeVisible();
    await visitorPage.getByLabel("Observaciones sobre esta revisión").fill("Synthetic final thanks");
    await visitorPage.getByRole("button", { name: "Añadir comentario" }).click();
    await expect(visitorPage.getByRole("region", { name: "Historial de acciones" }).getByText("Synthetic final thanks")).toBeVisible();
    expect(await visitorPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await visitorPage.screenshot({ path: "../docs/screenshots/sprint5-delivery-mobile.png", fullPage: true });
    await ownerPage.reload();
    await expect(ownerPage.getByText("Synthetic second cut", { exact: true })).toBeVisible();
    await ownerPage.getByRole("button", { name: "Revocar portal" }).click();
    await ownerPage.getByRole("button", { name: "Confirmar cambio de acceso" }).click();
    await expect(ownerPage.getByText(/Portal revocado/)).toBeVisible();
    await visitorPage.reload();
    await expect(visitorPage.getByText("Este enlace de entrega no existe o ha caducado.")).toBeVisible();
  });

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
    const deliveryClientSelect = deliveryDialog.getByLabel("Cliente");
    await expect(deliveryClientSelect.locator("option", { hasText: clientName })).toBeAttached();
    await deliveryClientSelect.selectOption({ label: clientName });
    await expect(deliveryClientSelect).not.toHaveValue("");
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
    await expect(visitorPage.getByRole("link", { name: "Ver entrega externa" })).toHaveAttribute(
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

    // La aprobacion queda registrada en el panel del estudio: primero se
    // comprueba por API (sin navegacion en curso) y despues se recarga la UI.
    const refreshed = await apiRequest(ownerPage, "GET", `/deliveries/${deliveryId}`);
    expect((await refreshed.json()).data.status).toBe("approved");

    // Los reintentos del visitante no deben repetir efectos en el estudio.
    for (let retry = 0; retry < 2; retry++) {
      const response = await visitorPage.request.post(`${apiUrl}/public/deliveries/${publicToken}/approve`);
      expect(response.status()).toBe(200);
    }
    const notifications = await apiRequest(ownerPage, "GET", "/notifications");
    const payload = await notifications.json();
    expect(payload.data.filter((item) => item.message === deliveryTitle && item.title === "Entrega aprobada por el cliente")).toHaveLength(1);

    await ownerPage.reload();
    const card = ownerPage.getByRole("article").filter({ hasText: deliveryTitle });
    await expect(card.getByRole("heading", { name: deliveryTitle })).toBeVisible();
    await expect(card.getByText("Aprobado", { exact: true })).toBeVisible();
  });
});
