import { expect, test } from "../fixtures/test.js";
import { apiRequest, findResourceId } from "../support/app.js";

test.describe("contratos", () => {
  test("el estudio crea, edita, envía y acepta; el ajeno no accede", async ({
    ownerPage,
    outsiderPage,
  }) => {
    const suffix = Date.now();
    const clientName = `Cliente Contrato E2E ${suffix}`;
    const jobTitle = `Boda Contrato E2E ${suffix}`;
    const contractTitle = `Contrato Servicios E2E ${suffix}`;

    const client = await apiRequest(ownerPage, "POST", "/clients", {
      name: clientName,
      status: "active",
    });
    expect(client.status(), "crear cliente").toBe(201);
    const clientId = (await client.json()).data.id;

    const job = await apiRequest(ownerPage, "POST", "/jobs", {
      client_id: clientId,
      title: jobTitle,
      specialty: "general",
      workflow_key: "general",
      status: "lead",
      contract_status: "not_required",
    });
    expect(job.status(), "crear trabajo").toBe(201);
    const jobId = (await job.json()).data.id;

    // Crear borrador sin contenido: se genera desde trabajo y cliente.
    const created = await apiRequest(ownerPage, "POST", "/contracts", {
      job_id: jobId,
      client_id: clientId,
      title: contractTitle,
    });
    expect(created.status(), "crear contrato").toBe(201);
    const draft = (await created.json()).data;
    expect(draft.contract_number).toMatch(/^CON-/);
    expect(draft.content).toContain(jobTitle);
    const contractId = await findResourceId(ownerPage, "/contracts", "title", contractTitle);

    // El borrador se edita y se envía con snapshot estable.
    const edited = await apiRequest(ownerPage, "PUT", `/contracts/${contractId}`, {
      job_id: jobId,
      client_id: clientId,
      title: `${contractTitle} v2`,
      content: "# Acuerdo\n\nAlcance cerrado.\n",
    });
    expect(edited.status(), "editar borrador").toBe(200);

    const sent = await apiRequest(ownerPage, "PATCH", `/contracts/${contractId}/status`, {
      status: "sent",
    });
    expect(sent.status(), "enviar contrato").toBe(200);
    expect((await sent.json()).data.version).toBe(2);

    const locked = await apiRequest(ownerPage, "PUT", `/contracts/${contractId}`, {
      job_id: jobId,
      client_id: clientId,
      title: "Cambio silencioso",
      content: "# Acuerdo\n\nAlcance cerrado.\n",
    });
    expect(locked.status(), "el enviado bloquea el contenido").toBe(422);

    await ownerPage.goto("/app/contracts");
    await expect(ownerPage.getByText(`${contractTitle} v2`)).toBeVisible();
    await expect(ownerPage.getByLabel(/Estado del contrato/)).toHaveValue("sent");

    const accepted = await apiRequest(ownerPage, "PATCH", `/contracts/${contractId}/status`, {
      status: "accepted",
    });
    expect(accepted.status(), "aceptar contrato").toBe(200);

    const jobDetail = await apiRequest(ownerPage, "GET", `/jobs/${jobId}`);
    expect((await jobDetail.json()).data.contract_status).toBe("signed");

    // Sin membership el contrato ajeno no existe.
    const foreign = await apiRequest(outsiderPage, "GET", `/contracts/${contractId}`);
    expect(foreign.status(), "sin membership el contrato es 404").toBe(404);
  });
});
