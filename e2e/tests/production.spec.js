import { readFile } from "node:fs/promises";
import { expect, test } from "../fixtures/test.js";
import { apiRequest } from "../support/app.js";

test("fotografías y jornadas permiten rodaje móvil, orden y PDF sin medios", async ({
  ownerPage,
  outsiderPage,
}, testInfo) => {
  test.setTimeout(120_000);
  const suffix = Date.now();
  const locationName = `Estudio producción ${suffix}`;
  const gearName = `Cámara producción ${suffix}`;
  expect(
    (
      await apiRequest(ownerPage, "POST", "/locations", {
        name: locationName,
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
  const response = await apiRequest(ownerPage, "POST", "/jobs", {
    title: `Retratos producción ${suffix}`,
    project_type: "photography",
    specialty: "portrait",
    workflow_key: "portrait",
    status: "preparation",
    contract_status: "not_required",
    create_workflow_tasks: false,
    participants: [{ name: "Equipo sintético", role: "Fotografía" }],
  });
  expect(response.status()).toBe(201);
  const job = (await response.json()).data;
  await ownerPage.goto(`/app/jobs/${job.id}`);
  await ownerPage
    .getByRole("button", { name: "Tomas y rodaje", exact: true })
    .click();
  await expect(
    ownerPage.getByRole("heading", { name: "Fotografías previstas" }),
  ).toBeVisible();
  await ownerPage.getByRole("button", { name: "Nueva jornada" }).click();
  const dayDialog = ownerPage.getByRole("dialog", {
    name: "Jornada de producción",
  });
  await dayDialog.getByLabel("Nombre de la jornada").fill("Retratos de mañana");
  await dayDialog.getByLabel("Fecha de producción").fill("2030-05-02");
  await dayDialog.getByLabel("Hora de inicio").fill("09:00");
  await dayDialog.getByLabel("Hora de fin").fill("12:00");
  await dayDialog
    .getByRole("radio", { name: locationName, exact: true })
    .check();
  await dayDialog
    .getByLabel("Notas de producción")
    .fill("Revisar briefing antes de comenzar.");
  await dayDialog.getByRole("button", { name: "Guardar jornada" }).click();
  await expect(dayDialog).toBeHidden();
  const dayArticle = ownerPage.getByRole("article", {
    name: "Jornada Retratos de mañana",
  });
  await expect(dayArticle).toContainText("Equipo sintético");
  const dayResponse = await apiRequest(
    ownerPage,
    "GET",
    `/jobs/${job.id}/production-days`,
  );
  const day = (await dayResponse.json()).data[0];
  expect(day.checklists).toHaveLength(2);

  await ownerPage.getByRole("button", { name: "Añadir toma" }).click();
  const shotDialog = ownerPage.getByRole("dialog", { name: "Editar toma" });
  await shotDialog
    .getByLabel("Descripción de la toma")
    .fill("Retrato con luz de ventana");
  await shotDialog
    .getByLabel("Tipo de plano o fotografía")
    .fill("Retrato medio");
  await shotDialog.getByLabel("Óptica o focal").fill("85 mm");
  await shotDialog.getByLabel("Duración estimada (segundos)").fill("30");
  await shotDialog.getByLabel("Hora prevista").fill("10:00");
  await shotDialog.getByLabel("Jornada asignada").selectOption(String(day.id));
  await shotDialog
    .getByRole("radio", { name: locationName, exact: true })
    .check();
  await shotDialog
    .getByRole("checkbox", { name: gearName, exact: true })
    .check();
  await shotDialog.getByRole("button", { name: "Guardar toma" }).click();
  await expect(shotDialog).toBeHidden();
  let shots = (
    await (await apiRequest(ownerPage, "GET", `/jobs/${job.id}/shots`)).json()
  ).data;
  const first = shots[0];
  expect(first.scene).toBeNull();
  expect(first.gear_items[0].name).toBe(gearName);
  await ownerPage
    .getByRole("article", { name: `Toma ${first.id}`, exact: true })
    .getByRole("button", { name: "Duplicar" })
    .click();
  await expect(
    ownerPage.getByRole("heading", {
      name: "Retrato con luz de ventana",
      exact: true,
    }),
  ).toHaveCount(2);
  shots = (
    await (await apiRequest(ownerPage, "GET", `/jobs/${job.id}/shots`)).json()
  ).data;
  const copy = shots[1];
  await ownerPage
    .getByRole("button", { name: `Subir toma ${copy.id}`, exact: true })
    .focus();
  await ownerPage
    .getByRole("button", { name: `Subir toma ${copy.id}`, exact: true })
    .press("Enter");
  await expect
    .poll(
      async () =>
        (
          await (
            await apiRequest(ownerPage, "GET", `/jobs/${job.id}/shots`)
          ).json()
        ).data[0].id,
    )
    .toBe(copy.id);

  await ownerPage.setViewportSize({ width: 390, height: 844 });
  await ownerPage.getByRole("button", { name: "Modo rodaje" }).click();
  const firstArticle = ownerPage.getByRole("article", {
    name: `Toma ${first.id}`,
    exact: true,
  });
  await firstArticle
    .getByLabel(`Estado de toma ${first.id}`)
    .selectOption("ready");
  await expect(
    firstArticle.getByLabel(`Estado de toma ${first.id}`),
  ).toHaveValue("ready");
  await firstArticle
    .getByLabel(`Estado de toma ${first.id}`)
    .selectOption("done");
  await firstArticle.getByRole("button", { name: "Observaciones" }).click();
  const notesDialog = ownerPage.getByRole("dialog", {
    name: "Observaciones de rodaje",
  });
  await notesDialog
    .getByLabel("Observaciones de la toma")
    .fill("Viento sintético: repetir con reflector.");
  await notesDialog
    .getByRole("button", { name: "Guardar observaciones" })
    .click();
  await expect(notesDialog).toBeHidden();
  await expect(firstArticle).toContainText("Viento sintético");
  await dayArticle
    .getByRole("checkbox", { name: "Comprobar equipo y baterías" })
    .click();
  await expect(
    dayArticle.getByRole("checkbox", { name: "Comprobar equipo y baterías" }),
  ).toBeChecked();
  await ownerPage
    .getByLabel("Filtrar por jornada")
    .selectOption(String(day.id));
  await expect(firstArticle).toBeVisible();
  await expect
    .poll(() =>
      ownerPage.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await firstArticle.scrollIntoViewIfNeeded();
  await ownerPage.screenshot({
    path: testInfo.outputPath("production-mobile.png"),
    animations: "disabled",
  });

  const downloadEvent = ownerPage.waitForEvent("download");
  await ownerPage.getByRole("button", { name: "Descargar PDF" }).click();
  const download = await downloadEvent;
  const pdfPath = testInfo.outputPath("synthetic-production.pdf");
  await download.saveAs(pdfPath);
  expect((await readFile(pdfPath)).subarray(0, 5).toString()).toBe("%PDF-");
  await ownerPage.reload();
  await ownerPage
    .getByRole("button", { name: "Tomas y rodaje", exact: true })
    .click();
  await expect(
    ownerPage.getByRole("article", { name: `Toma ${first.id}`, exact: true }),
  ).toContainText("Viento sintético");
  await expect(ownerPage.getByLabel(`Estado de toma ${first.id}`)).toHaveValue(
    "done",
  );
  await expect(
    dayArticle.getByRole("checkbox", { name: "Comprobar equipo y baterías" }),
  ).toBeChecked();
  const copiedArticle = ownerPage.getByRole("article", {
    name: `Toma ${copy.id}`,
    exact: true,
  });
  await copiedArticle
    .getByLabel(`Estado de toma ${copy.id}`)
    .selectOption("discarded");
  await expect(
    copiedArticle.getByLabel(`Estado de toma ${copy.id}`),
  ).toHaveValue("discarded");
  await copiedArticle
    .getByRole("button", { name: "Eliminar", exact: true })
    .click();
  await ownerPage
    .getByRole("button", { name: "Confirmar eliminación" })
    .click();
  await expect(copiedArticle).toHaveCount(0);
  expect(
    (await apiRequest(outsiderPage, "GET", `/jobs/${job.id}/shots`)).status(),
  ).toBe(404);
  expect(
    (
      await apiRequest(
        outsiderPage,
        "PATCH",
        `/jobs/${job.id}/shots/${first.id}`,
        { status: "done", revision: 0 },
      )
    ).status(),
  ).toBe(404);
  expect(
    (
      await apiRequest(outsiderPage, "GET", `/jobs/${job.id}/production/pdf`)
    ).status(),
  ).toBe(404);
});
