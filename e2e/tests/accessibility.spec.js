import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures/test.js";
import { apiRequest } from "../support/app.js";

/** Falla ante violaciones serias o criticas WCAG 2.x A/AA; las menores no bloquean. */
async function expectNoSeriousViolations(page, label) {
  // Las transiciones de entrada falsean el contraste (opacidad intermedia): se espera a que acaben.
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => {}))),
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));

  expect(
    blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodos, p. ej. ${v.nodes.slice(0, 3).map((n) => `${n.target} ${n.any[0]?.message ?? ""}`).join(" | ")}`),
    `Violaciones de accesibilidad en ${label}`,
  ).toEqual([]);
}

async function createClient(ownerPage, name) {
  const response = await apiRequest(ownerPage, "POST", "/clients", { name, status: "active" });
  expect(response.status()).toBe(201);
  return (await response.json()).data.id;
}

test.describe("accesibilidad (axe)", () => {
  test("landing publica", async ({ visitorPage }) => {
    await visitorPage.goto("/");
    await expect(visitorPage.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoSeriousViolations(visitorPage, "la landing");
  });

  test("login", async ({ visitorPage }) => {
    await visitorPage.goto("/login");
    await expect(visitorPage.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expectNoSeriousViolations(visitorPage, "el login");
  });

  test("dashboard", async ({ ownerPage }) => {
    await ownerPage.goto("/app/dashboard");
    await expect(ownerPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expectNoSeriousViolations(ownerPage, "el dashboard");
  });

  test("portal de entrega", async ({ ownerPage, visitorPage }) => {
    const suffix = Date.now();
    const clientId = await createClient(ownerPage, `Cliente A11y ${suffix}`);
    const created = await apiRequest(ownerPage, "POST", "/deliveries", {
      client_id: clientId,
      title: `Entrega A11y ${suffix}`,
      status: "delivered",
    });
    expect(created.status()).toBe(201);
    const deliveryId = (await created.json()).data.id;
    const detail = await apiRequest(ownerPage, "GET", `/deliveries/${deliveryId}`);
    const { public_token: token } = (await detail.json()).data;

    await visitorPage.goto(`/deliver/${token}`);
    await expect(visitorPage.getByText(`Entrega A11y ${suffix}`)).toBeVisible();
    await expectNoSeriousViolations(visitorPage, "el portal de entrega");
  });

  test("portal de contrato", async ({ ownerPage, visitorPage }) => {
    const suffix = Date.now();
    const clientId = await createClient(ownerPage, `Cliente Contrato A11y ${suffix}`);
    const job = await apiRequest(ownerPage, "POST", "/jobs", {
      client_id: clientId,
      title: `Trabajo A11y ${suffix}`,
      specialty: "general",
      workflow_key: "general",
      status: "lead",
      contract_status: "not_required",
    });
    expect(job.status()).toBe(201);
    const created = await apiRequest(ownerPage, "POST", "/contracts", {
      job_id: (await job.json()).data.id,
      client_id: clientId,
      title: `Contrato A11y ${suffix}`,
      content: `# Acuerdo A11y ${suffix}\n\nAlcance cerrado.\n`,
    });
    expect(created.status()).toBe(201);
    const contractId = (await created.json()).data.id;
    expect((await apiRequest(ownerPage, "PATCH", `/contracts/${contractId}/status`, { status: "sent" })).status()).toBe(200);
    const portal = await apiRequest(ownerPage, "POST", `/contracts/${contractId}/portal`);
    expect(portal.status()).toBe(201);
    const { token } = (await portal.json()).meta;

    await visitorPage.goto(`/contract/${token}`);
    await expect(visitorPage.getByRole("heading", { name: `Contrato A11y ${suffix}` })).toBeVisible();
    await expectNoSeriousViolations(visitorPage, "el portal de contrato");
  });
});
