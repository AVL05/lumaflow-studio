export const stageStatuses = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En curso" },
  { value: "completed", label: "Completada" },
  { value: "skipped", label: "Omitida" },
];
export const workflowPhases = [
  ["preparation", "Preparación"],
  ["production", "Producción"],
  ["postproduction", "Postproducción"],
  ["delivery", "Entrega"],
];
export const lines = (value) =>
  value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
const draftChecks = (checks) =>
  (checks ?? []).map((c) => ({ name: c.name, items: c.items.join("\n") }));
const checksPayload = (checks) => checks.map((c) => ({ name: c.name, items: lines(c.items) }));

export function templateForm(template, copy = false) {
  const definition = template?.definition ?? { tasks: [], stages: [], checklists: [] };
  return {
    name: template ? `${template.name}${copy ? " (copia)" : ""}` : "",
    description: template?.description ?? "",
    phases: Object.fromEntries(
      workflowPhases.map(([key]) => [
        key,
        definition.tasks
          .filter((t) => t.phase === key)
          .map((t) => t.title)
          .join("\n"),
      ]),
    ),
    checklists: draftChecks(definition.checklists),
    stages: definition.stages.map((s) => ({
      key: s.key,
      label: s.label,
      tasks: s.tasks.join("\n"),
      checklists: draftChecks(s.checklists),
    })),
  };
}
export function templatePayload(form) {
  return {
    name: form.name,
    description: form.description,
    definition: {
      tasks: workflowPhases.flatMap(([phase]) =>
        lines(form.phases[phase]).map((title) => ({ title, phase })),
      ),
      checklists: checksPayload(form.checklists),
      stages: form.stages.map((s) => ({
        key: s.key,
        label: s.label,
        tasks: lines(s.tasks),
        checklists: checksPayload(s.checklists),
      })),
    },
  };
}
export function stageForm(stage) {
  return {
    label: stage?.label ?? "",
    status: stage?.status ?? "pending",
    assigned_user_id: stage?.assigned_user_id ?? "",
    due_date: stage?.due_date ?? "",
    notes: stage?.notes ?? "",
  };
}
export function taskForm(job, stage, task) {
  return {
    job_id: job.id,
    stage_id: stage?.id ?? task?.stage_id ?? null,
    client_id: job.client_id ?? null,
    title: task?.title ?? "",
    description: task?.description ?? "",
    priority: task?.priority ?? "medium",
    status: task?.status ?? "todo",
    session_id: task?.session_id ?? null,
    assigned_user_id: task?.assigned_user_id ?? "",
    workflow_phase:
      task?.workflow_phase ??
      (stage?.key === "delivered" ? "delivery" : stage ? "postproduction" : "preparation"),
    due_date: task?.due_date ?? "",
    due_time: task?.due_time ?? "",
  };
}
export function taskPayload(form, revision) {
  return {
    ...form,
    due_date: form.due_date || null,
    due_time: form.due_time || null,
    assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null,
    ...(revision !== undefined ? { revision } : {}),
  };
}
