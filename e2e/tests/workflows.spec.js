import { expect, test } from "../fixtures/test.js";
import { apiRequest } from "../support/app.js";

test("plantillas y postproducción manual preservan históricos, permisos y duplicados", async ({
  ownerPage,
  outsiderPage,
}, testInfo) => {
  test.setTimeout(150_000);
  const response = await apiRequest(ownerPage, "POST", "/jobs", {
    title: `Postproducción sintética ${Date.now()}`,
    project_type: "photography",
    specialty: "portrait",
    workflow_key: "portrait",
    status: "quoted",
    contract_status: "not_required",
    description: "Briefing histórico sintético",
    create_workflow_tasks: false,
  });
  expect(response.status()).toBe(201);
  const job = (await response.json()).data;
  const root = `/jobs/${job.id}/workflow`;
  await ownerPage.goto(`/app/jobs/${job.id}`);
  await ownerPage
    .getByRole("button", { name: "Postproducción", exact: true })
    .click();
  await expect(
    ownerPage.getByText("El proyecto conserva su workflow actual.", {
      exact: false,
    }),
  ).toBeVisible();
  await ownerPage
    .getByRole("button", { name: "Plantillas", exact: true })
    .click();
  const portrait = ownerPage.getByRole("article", {
    name: "Plantilla Retrato",
    exact: true,
  });
  await expect(portrait).toBeVisible();
  for (const name of [
    "Boda",
    "Fotografía de producto",
    "Evento",
    "Videoclip",
    "Vídeo comercial",
    "Entrevista",
    "Documental",
    "Contenido vertical",
  ])
    await expect(
      ownerPage.getByRole("article", {
        name: `Plantilla ${name}`,
        exact: true,
      }),
    ).toBeVisible();
  await portrait.getByRole("button", { name: "Previsualizar" }).click();
  let preview = ownerPage.getByRole("dialog", {
    name: "Previsualizar plantilla",
  });
  await expect(
    preview.getByRole("button", { name: "Confirmar aplicación" }),
  ).toBeDisabled();
  expect(
    (await (await apiRequest(ownerPage, "GET", `/jobs/${job.id}`)).json()).data
      .tasks,
  ).toHaveLength(0);
  await preview.getByRole("checkbox").check();
  await preview.getByRole("button", { name: "Confirmar aplicación" }).click();
  await expect(preview).toBeHidden();
  let board = (await (await apiRequest(ownerPage, "GET", root)).json()).data;
  expect(board.stages).toHaveLength(8);
  expect(board.applications).toHaveLength(1);
  const initialTaskCount =
    board.tasks.length + board.stages.reduce((n, s) => n + s.tasks.length, 0);
  expect(
    [...board.tasks, ...board.stages.flatMap((s) => s.tasks)].every(
      (t) => !t.due_date && !t.assigned_user_id,
    ),
  ).toBe(true);
  const member = board.members[0];
  await ownerPage
    .getByRole("button", { name: "Panel de postproducción" })
    .click();
  const initial = ownerPage.getByRole("article", {
    name: "Etapa Importación pendiente",
    exact: true,
  });
  for (const task of board.stages[0].tasks) {
    const checkbox = initial.getByRole("checkbox", {
      name: `Completar ${task.title}`,
      exact: true,
    });
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  }
  for (const check of board.stages[0].checklists)
    for (const item of check.items) {
      const checkbox = initial.getByRole("checkbox", {
        name: item.title,
        exact: true,
      });
      await checkbox.click();
      await expect(checkbox).toBeChecked();
    }
  await initial
    .getByRole("combobox", {
      name: "Estado de Importación pendiente",
      exact: true,
    })
    .selectOption("completed");
  await expect(
    initial.getByRole("combobox", {
      name: "Estado de Importación pendiente",
      exact: true,
    }),
  ).toHaveValue("completed");
  const selection = ownerPage.getByRole("article", {
    name: "Etapa Selección",
    exact: true,
  });
  await selection.getByRole("button", { name: "Editar etapa" }).click();
  let dialog = ownerPage.getByRole("dialog", { name: "Configurar etapa" });
  await dialog
    .getByLabel("Responsable de la etapa")
    .selectOption(String(member.id));
  await dialog.getByLabel("Fecha de la etapa").fill("2030-05-10");
  await dialog
    .getByLabel("Observaciones de la etapa")
    .fill("Selección sintética con criterios del briefing.");
  await dialog.getByRole("button", { name: "Guardar etapa" }).click();
  await expect(dialog).toBeHidden();
  await expect(selection).toContainText("2030-05-10");
  await selection
    .getByRole("button", { name: "Añadir tarea", exact: true })
    .click();
  dialog = ownerPage.getByRole("dialog", { name: "Tarea del proyecto" });
  await dialog
    .getByLabel("Titulo")
    .fill("Revisar selección sintética adicional");
  await dialog
    .getByLabel("Responsable de la tarea")
    .selectOption(String(member.id));
  await dialog.getByLabel("Fecha limite").fill("2030-05-09");
  await dialog.getByRole("button", { name: "Guardar tarea" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    selection.getByRole("button", {
      name: "Revisar selección sintética adicional",
      exact: true,
    }),
  ).toBeVisible();

  await ownerPage
    .getByRole("button", { name: "Plantillas", exact: true })
    .click();
  await portrait.getByRole("button", { name: "Duplicar y editar" }).click();
  dialog = ownerPage.getByRole("dialog", { name: "Plantilla del estudio" });
  const customName = `Retrato propio ${job.id}`;
  await dialog.getByLabel("Nombre de la plantilla").fill(customName);
  await dialog
    .getByLabel("Tareas de preparación (una por línea)")
    .fill("Revisar preparación personalizada sintética");
  await dialog
    .getByRole("button", { name: "Guardar plantilla", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  const custom = ownerPage.getByRole("article", {
    name: `Plantilla ${customName}`,
    exact: true,
  });
  await expect(custom).toBeVisible();
  await custom
    .getByRole("button", { name: "Editar plantilla", exact: true })
    .click();
  dialog = ownerPage.getByRole("dialog", { name: "Plantilla del estudio" });
  await dialog
    .getByLabel("Descripción de la plantilla")
    .fill("Plantilla propia reutilizable sin fechas ni recursos.");
  await dialog.getByText("1. Importación pendiente", { exact: true }).click();
  const controls = dialog.getByLabel("Etapa 1 · controles 1 (uno por línea)");
  await controls.fill(
    `${await controls.inputValue()}\nConfirmar copia adicional sintética`,
  );
  await dialog
    .getByRole("button", { name: "Guardar plantilla", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await custom.getByRole("button", { name: "Previsualizar" }).click();
  preview = ownerPage.getByRole("dialog", { name: "Previsualizar plantilla" });
  await preview.getByText(/^Checklists ·/).click();
  await expect(
    preview.getByText("Crear: Confirmar copia adicional sintética", {
      exact: true,
    }),
  ).toBeVisible();
  await preview.getByRole("checkbox").check();
  await preview.getByRole("button", { name: "Confirmar aplicación" }).click();
  await expect(preview).toBeHidden();
  board = (await (await apiRequest(ownerPage, "GET", root)).json()).data;
  expect(board.stages).toHaveLength(8);
  expect(board.applications).toHaveLength(2);
  expect(board.stages[0].status).toBe("in_progress");
  expect(board.stages[0].checklists[0].items).toHaveLength(2);
  expect(board.stages[0].checklists[0].items[0].is_completed).toBe(true);
  expect(board.stages[0].checklists[0].items[1].is_completed).toBe(false);
  expect(
    board.tasks.length + board.stages.reduce((n, s) => n + s.tasks.length, 0),
  ).toBe(initialTaskCount + 2);
  await portrait.getByRole("button", { name: "Previsualizar" }).click();
  preview = ownerPage.getByRole("dialog", { name: "Previsualizar plantilla" });
  await expect(preview.getByText(/Esta plantilla ya se aplicó/)).toBeVisible();
  await expect(
    preview.getByRole("button", { name: "Confirmar aplicación" }),
  ).toBeDisabled();
  await preview.getByRole("button", { name: "Cerrar dialogo" }).click();
  await ownerPage
    .getByRole("button", { name: "Panel de postproducción" })
    .click();
  await ownerPage.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      ownerPage.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await selection.scrollIntoViewIfNeeded();
  await ownerPage.screenshot({
    path: testInfo.outputPath("postproduction-mobile.png"),
    animations: "disabled",
  });
  await ownerPage.reload();
  await ownerPage
    .getByRole("button", { name: "Postproducción", exact: true })
    .click();
  await expect(selection).toContainText(
    "Selección sintética con criterios del briefing.",
  );
  const saved = (
    await (await apiRequest(ownerPage, "GET", `/jobs/${job.id}`)).json()
  ).data;
  expect(saved.status).toBe("quoted");
  expect(saved.description).toBe("Briefing histórico sintético");
  expect(saved.gear_items).toHaveLength(0);
  expect(saved.sessions).toHaveLength(0);
  expect((await apiRequest(outsiderPage, "GET", root)).status()).toBe(404);
  expect(
    (
      await apiRequest(
        outsiderPage,
        "PUT",
        `${root}/stages/${board.stages[0].id}`,
        { revision: 0, notes: "Unauthorized" },
      )
    ).status(),
  ).toBe(404);
});
