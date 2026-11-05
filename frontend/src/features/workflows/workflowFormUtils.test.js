import { expect, it } from "vitest";
import {
  stageForm,
  taskForm,
  taskPayload,
  templateForm,
  templatePayload,
} from "./workflowFormUtils";

const template = {
  name: "Entrevista",
  description: "Manual",
  definition: {
    tasks: [{ title: "Preparar preguntas", phase: "preparation" }],
    checklists: [{ name: "Sonido", items: ["Revisar audio"] }],
    stages: [
      {
        key: "editing",
        label: "Edición",
        tasks: ["Montar entrevista"],
        checklists: [{ name: "Revisión", items: ["Confirmar continuidad"] }],
      },
    ],
  },
};
it("conserva la definición al editar y duplicar sin generar fechas o recursos", () => {
  expect(templatePayload(templateForm(template))).toEqual(template);
  expect(templatePayload(templateForm(template, true)).name).toBe("Entrevista (copia)");
  expect(JSON.stringify(templatePayload(templateForm(template)))).not.toMatch(
    /due_date|assigned_user_id|gear_item_ids/,
  );
});
it("conserva saltos durante edición y normaliza las listas solo al guardar", () => {
  const form = templateForm(template);
  form.phases.production = "Primera toma\n\nSegunda toma\n";
  expect(templatePayload(form).definition.tasks).toContainEqual({
    title: "Segunda toma",
    phase: "production",
  });
  expect(form.phases.production.endsWith("\n")).toBe(true);
});
it("una tarea nueva no inventa fecha ni responsable y una existente conserva revisión", () => {
  const form = taskForm({ id: 3 }, { id: 5 });
  expect(taskPayload(form)).toMatchObject({
    job_id: 3,
    stage_id: 5,
    due_date: null,
    assigned_user_id: null,
  });
  expect(taskPayload({ ...form, assigned_user_id: "7", due_date: "2030-01-01" }, 2)).toMatchObject({
    assigned_user_id: 7,
    due_date: "2030-01-01",
    revision: 2,
  });
  expect(stageForm()).toMatchObject({ due_date: "", assigned_user_id: "", status: "pending" });
  expect(taskForm({ id: 3 }, { id: 8, key: "delivered" }).workflow_phase).toBe("delivery");
});
