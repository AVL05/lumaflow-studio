import { expect, test } from "../fixtures/test.js";
import { apiRequest } from "../support/app.js";

async function createSentContract(ownerPage, suffix, title) {
  const clientName = `Cliente Portal E2E ${suffix}`;

  const client = await apiRequest(ownerPage, "POST", "/clients", {
    name: clientName,
    status: "active",
  });
  expect(client.status()).toBe(201);
  const clientId = (await client.json()).data.id;

  const job = await apiRequest(ownerPage, "POST", "/jobs", {
    client_id: clientId,
    title: `Boda Portal E2E ${suffix}`,
    specialty: "general",
    workflow_key: "general",
    status: "lead",
    contract_status: "not_required",
  });
  expect(job.status()).toBe(201);
  const jobId = (await job.json()).data.id;

  const created = await apiRequest(ownerPage, "POST", "/contracts", {
    job_id: jobId,
    client_id: clientId,
    title,
    content: `# Acuerdo Portal E2E ${suffix}\n\nAlcance cerrado.\n`,
  });
  expect(created.status()).toBe(201);
  const contractId = (await created.json()).data.id;

  const sent = await apiRequest(ownerPage, "PATCH", `/contracts/${contractId}/status`, {
    status: "sent",
  });
  expect(sent.status()).toBe(200);

  return contractId;
}

test.describe("portal de contratos", () => {
  test("el cliente acepta desde el enlace y el estudio ve el resultado", async ({
    ownerPage,
    visitorPage,
  }) => {
    const suffix = Date.now();
    const contractId = await createSentContract(ownerPage, suffix, `Contrato Portal E2E ${suffix}`);

    const generated = await apiRequest(ownerPage, "POST", `/contracts/${contractId}/portal`);
    expect(generated.status()).toBe(201);
    const { token } = (await generated.json()).meta;
    expect(token).toBeTruthy();

    await visitorPage.goto(`/contract/${token}`);
    await expect(visitorPage.getByRole("heading", { name: `Contrato Portal E2E ${suffix}` })).toBeVisible();
    await expect(visitorPage.getByText(`Acuerdo Portal E2E ${suffix}`)).toBeVisible();

    await visitorPage.getByRole("button", { name: "Aceptar contrato" }).click();
    await expect(visitorPage.getByText("Has aceptado este contrato. Gracias.")).toBeVisible();

    const detail = await apiRequest(ownerPage, "GET", `/contracts/${contractId}`);
    expect(detail.status()).toBe(200);
    expect((await detail.json()).data.status).toBe("accepted");

    const notifications = await apiRequest(ownerPage, "GET", "/notifications");
    const titles = ((await notifications.json()).data ?? []).map((item) => item.title);
    expect(titles).toContain("Contrato aceptado por el cliente");
  });

  test("el rechazo con comentario queda visible y regenerar invalida el enlace", async ({
    ownerPage,
    visitorPage,
  }) => {
    const suffix = Date.now();
    const contractId = await createSentContract(ownerPage, suffix, `Contrato Rechazo E2E ${suffix}`);

    const generated = await apiRequest(ownerPage, "POST", `/contracts/${contractId}/portal`);
    const { token } = (await generated.json()).meta;

    await visitorPage.goto(`/contract/${token}`);
    await visitorPage.getByRole("button", { name: "Rechazar" }).click();
    await visitorPage.getByLabel(/Comentario opcional/).fill("Mover la fecha, por favor");
    await visitorPage.getByRole("button", { name: "Confirmar rechazo" }).click();
    await expect(visitorPage.getByText("Has rechazado este contrato.")).toBeVisible();

    const detail = await apiRequest(ownerPage, "GET", `/contracts/${contractId}`);
    const data = (await detail.json()).data;
    expect(data.status).toBe("rejected");
    expect(data.client_message).toBe("Mover la fecha, por favor");

    const regenerated = await apiRequest(
      ownerPage,
      "POST",
      `/contracts/${contractId}/portal/regenerate`,
    );
    expect(regenerated.status()).toBe(200);
    const { token: fresh } = (await regenerated.json()).meta;
    expect(fresh).not.toBe(token);

    await visitorPage.goto(`/contract/${token}`);
    await expect(visitorPage.getByText(/ya no está disponible/)).toBeVisible();

    await visitorPage.goto(`/contract/${fresh}`);
    await expect(
      visitorPage.getByRole("heading", { name: `Contrato Rechazo E2E ${suffix}` }),
    ).toBeVisible();
  });
});
