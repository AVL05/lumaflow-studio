import { expect, test } from "../fixtures/test.js";
import { apiRequest, findResourceId } from "../support/app.js";

test("proyecto personal y briefing manual conservan datos al recargar en móvil", async ({
  ownerPage,
  outsiderPage,
}, testInfo) => {
  test.setTimeout(90_000);
  const suffix = Date.now();
  const title = `Documental personal ${suffix}`;
  await ownerPage.goto("/app/jobs");
  await ownerPage.getByRole("button", { name: "Nuevo proyecto" }).click();
  const create = ownerPage.getByRole("dialog", { name: "Nuevo proyecto" });
  await create.getByLabel("Nombre del proyecto").fill(title);
  await create
    .getByRole("combobox", { name: /^Tipo de proyecto/ })
    .selectOption("personal");
  await create
    .getByLabel("Descripción", { exact: true })
    .fill("Notas iniciales del documental sintético.");
  await create.getByRole("button", { name: "Añadir participante" }).click();
  await create.getByLabel("Nombre participante 1").fill("Equipo sintético");
  await create.getByLabel("Rol participante 1").fill("Dirección");
  await create.getByLabel("Inicio", { exact: true }).fill("2030-03-01");
  await create.getByLabel("Fin", { exact: true }).fill("2030-03-02");
  await create.getByRole("button", { name: "Añadir enlace" }).click();
  await create.getByLabel("Nombre enlace 1").fill("Referencias creativas");
  await create
    .getByLabel("URL enlace 1")
    .fill("https://example.test/references");
  await create
    .getByRole("button", { name: "Crear proyecto", exact: true })
    .click();
  await expect(create).toBeHidden();
  const id = await findResourceId(ownerPage, "/jobs", "title", title);
  const response = await apiRequest(ownerPage, "GET", `/jobs/${id}`);
  expect((await response.json()).data.client_id).toBeNull();
  await ownerPage.getByRole("link", { name: new RegExp(title) }).click();
  await expect(ownerPage.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    ownerPage.getByText("Equipo sintético", { exact: true }),
  ).toBeVisible();
  await expect(
    ownerPage.getByRole("link", { name: /Referencias creativas/ }),
  ).toHaveAttribute("href", "https://example.test/references");

  const placeName = `Estudio sintético ${suffix}`;
  const gearName = `Cámara sintética ${suffix}`;
  expect(
    (
      await apiRequest(ownerPage, "POST", "/locations", {
        name: placeName,
        latitude: 0,
        longitude: 0,
        type: "studio",
        access_difficulty: "easy",
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await apiRequest(ownerPage, "POST", "/gear", {
        name: gearName,
        category: "camera",
        condition: "active",
      })
    ).status(),
  ).toBe(201);
  await ownerPage.getByRole("button", { name: "Editar proyecto" }).click();
  const edit = ownerPage.getByRole("dialog", { name: "Editar proyecto" });
  await edit
    .getByRole("group", { name: "Otras localizaciones", exact: true })
    .getByRole("checkbox", { name: placeName })
    .check();
  await edit
    .getByRole("group", { name: "Equipo necesario", exact: true })
    .getByRole("checkbox", { name: gearName })
    .check();
  await edit.getByRole("button", { name: "Guardar proyecto" }).click();
  await expect(edit).toBeHidden();
  await ownerPage
    .getByRole("button", { name: "Planificación", exact: true })
    .click();
  await expect(ownerPage.getByRole("link", { name: placeName })).toBeVisible();
  await expect(ownerPage.getByText(gearName, { exact: true })).toBeVisible();

  await ownerPage
    .getByRole("button", { name: "Briefing", exact: true })
    .click();
  await ownerPage
    .getByLabel("Objetivos creativos")
    .fill("Explorar la memoria del paisaje sin datos reales.");
  await ownerPage
    .getByLabel("Necesidades técnicas")
    .fill("Sonido directo y luz natural.");
  await ownerPage
    .getByLabel("Riesgos", { exact: true })
    .fill("Ruido exterior.");
  await ownerPage.getByRole("button", { name: "Guardar briefing" }).click();
  await expect(
    ownerPage.getByText("Briefing guardado.", { exact: true }),
  ).toBeVisible();
  await ownerPage.reload();
  await ownerPage
    .getByRole("button", { name: "Briefing", exact: true })
    .click();
  await expect(ownerPage.getByLabel("Objetivos creativos")).toHaveValue(
    "Explorar la memoria del paisaje sin datos reales.",
  );
  await ownerPage.setViewportSize({ width: 1280, height: 900 });
  await expect(
    ownerPage.getByRole("button", { name: "Briefing", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await ownerPage.screenshot({
    path: testInfo.outputPath("creative-workspace-desktop.png"),
    animations: "disabled",
    fullPage: true,
  });
  await ownerPage.setViewportSize({ width: 390, height: 844 });
  await expect(
    ownerPage.getByRole("button", { name: "Guardar briefing" }),
  ).toBeDisabled();
  expect(
    await ownerPage.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await ownerPage.screenshot({
    path: testInfo.outputPath("creative-workspace-mobile.png"),
    animations: "disabled",
  });
  await ownerPage
    .getByRole("textbox", { name: "Notas", exact: true })
    .fill("Borrador local sin guardar");
  await ownerPage.getByRole("link", { name: "← Proyectos" }).click();
  const discard = ownerPage.getByRole("dialog", {
    name: "Cambios sin guardar",
  });
  await discard.getByRole("button", { name: "Volver al proyecto" }).click();
  await expect(
    ownerPage.getByRole("textbox", { name: "Notas", exact: true }),
  ).toHaveValue("Borrador local sin guardar");
  await ownerPage.getByRole("button", { name: "Guardar briefing" }).click();
  await expect(
    ownerPage.getByText("Briefing guardado.", { exact: true }),
  ).toBeVisible();
  expect((await apiRequest(outsiderPage, "GET", `/jobs/${id}`)).status()).toBe(
    404,
  );
  expect(
    (
      await apiRequest(outsiderPage, "PUT", `/jobs/${id}/briefing`, {
        briefing: { notes: "Foreign change" },
        revision: 1,
      })
    ).status(),
  ).toBe(404);
});

test("un proyecto audiovisual y un trabajo antiguo mantienen identidad y funciones comerciales", async ({
  ownerPage,
}) => {
  const suffix = Date.now();
  const payload = {
    title: `Proyecto audiovisual ${suffix}`,
    specialty: "general",
    workflow_key: "general",
    status: "shoot",
    contract_status: "not_required",
    project_type: "audiovisual",
  };
  const created = await apiRequest(ownerPage, "POST", "/jobs", payload);
  expect(created.status()).toBe(201);
  const project = (await created.json()).data;
  expect(project.production_phase).toBe("production");
  await ownerPage.goto(`/app/jobs/${project.id}`);
  await expect(
    ownerPage.getByRole("heading", { name: payload.title }),
  ).toBeVisible();
  await ownerPage
    .getByRole("combobox", { name: /^Estado del proyecto/ })
    .selectOption("editing");
  await expect(
    ownerPage.getByRole("listitem").filter({ hasText: "Postproducción" }),
  ).toHaveAttribute("aria-current", "step");
  const legacy = await apiRequest(ownerPage, "POST", "/jobs", {
    ...payload,
    title: `Trabajo antiguo ${suffix}`,
    project_type: undefined,
    description: "Descripción anterior conservada",
    budget: 750,
    create_workflow_tasks: false,
  });
  expect(legacy.status()).toBe(201);
  const old = (await legacy.json()).data;
  expect(old.project_type).toBe("photography");
  await ownerPage.goto(`/app/jobs/${old.id}`);
  await expect(
    ownerPage.getByText("Descripción anterior conservada"),
  ).toBeVisible();
  await ownerPage.getByRole("button", { name: "Gestión comercial" }).focus();
  await ownerPage.keyboard.press("Enter");
  await expect(
    ownerPage.getByRole("link", { name: "Presupuesto", exact: true }),
  ).toBeVisible();
  await expect(
    ownerPage.getByRole("combobox", { name: /^Estado del contrato/ }),
  ).toBeVisible();
});
