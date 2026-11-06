import { useCallback, useEffect, useState } from "react";
import { workflowsApi } from "../../api/workflows";
import { tasksApi } from "../../api/tasks";
import { checklistsApi } from "../../api/checklists";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Pagination } from "../../components/ui/Pagination";
import { ErrorState } from "../../components/states/ErrorState";
import { TaskForm } from "../tasks/TaskForm";
import { WorkflowTemplateEditor } from "./WorkflowTemplateEditor";
import {
  lines,
  stageForm,
  stageStatuses,
  taskForm,
  taskPayload,
  templateForm,
  templatePayload,
} from "./workflowFormUtils";

const modalTitles = {
  stage: "Configurar etapa",
  task: "Tarea del proyecto",
  checklist: "Nueva checklist",
  template: "Plantilla del estudio",
  preview: "Previsualizar plantilla",
  initialize: "Preparar postproducción",
};
const actionLabels = { create: "Crear", reuse: "Reutilizar" };

export function PostproductionWorkspace({ job, onRefresh, onDirtyChange, onSectionChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("board");
  const [catalog, setCatalog] = useState(null);
  const [page, setPage] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [discard, setDiscard] = useState(false);
  const dirty = Boolean(editor?.form && JSON.stringify(editor.form) !== editor.baseline);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await workflowsApi.show(job.id));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [job.id]);
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      setCatalog(await workflowsApi.templates(job.id, page));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setCatalogLoading(false);
    }
  }, [job.id, page]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (view === "templates") loadCatalog();
  }, [view, loadCatalog]);
  function open(kind, record, stage, copy = false) {
    const form =
      kind === "stage"
        ? stageForm(record)
        : kind === "task"
          ? taskForm(job, stage, record)
          : kind === "checklist"
            ? { name: "", items: "" }
            : kind === "template"
              ? templateForm(record, copy)
              : null;
    setEditor({ kind, record, stage, copy, form, baseline: JSON.stringify(form) });
    setError("");
    setConflict(false);
    setDiscard(false);
  }
  function close() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else setEditor(null);
  }
  function setForm(updater) {
    setEditor((current) => ({
      ...current,
      form: typeof updater === "function" ? updater(current.form) : updater,
    }));
  }
  async function perform(action, closeEditor = false, projectChanged = false) {
    setBusy(true);
    setError("");
    setMessage("");
    setConflict(false);
    try {
      const result = await action();
      if (closeEditor) setEditor(null);
      await load();
      if (projectChanged) await onRefresh?.();
      if (view === "templates") await loadCatalog();
      setMessage(
        result?.already_applied
          ? "Esta plantilla ya estaba aplicada. No se han creado duplicados."
          : "Cambios guardados.",
      );
    } catch (err) {
      setError(getApiError(err));
      setConflict(err.response?.status === 409);
    } finally {
      setBusy(false);
    }
  }
  async function preview(template) {
    setBusy(true);
    setError("");
    try {
      setEditor({
        kind: "preview",
        preview: await workflowsApi.preview(job.id, template.key),
        confirmed: false,
      });
      setConflict(false);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
    }
  }
  function save(event) {
    event.preventDefault();
    const { kind, record, form, stage, copy } = editor;
    if (kind === "stage") {
      const payload = {
        ...form,
        due_date: form.due_date || null,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null,
      };
      return perform(
        () =>
          record
            ? workflowsApi.updateStage(job.id, record.id, { ...payload, revision: record.revision })
            : workflowsApi.createStage(job.id, payload),
        true,
      );
    }
    if (kind === "task")
      return perform(
        () =>
          record
            ? tasksApi.update(record.id, taskPayload(form, record.revision))
            : workflowsApi.createTask(job.id, taskPayload(form)),
        true,
        true,
      );
    if (kind === "checklist")
      return perform(
        () =>
          workflowsApi.createChecklist(job.id, {
            job_id: job.id,
            stage_id: stage?.id ?? null,
            name: form.name,
            type: "custom",
            use_template: false,
            items: lines(form.items),
          }),
        true,
      );
    if (kind === "template")
      return perform(
        () =>
          workflowsApi.saveTemplate(job.id, copy ? null : record?.key, {
            ...templatePayload(form),
            ...(!copy && record ? { revision: record.revision } : {}),
          }),
        true,
      );
  }
  const members = data?.members ?? [];
  function assignee(id) {
    return id
      ? (members.find((m) => m.id === id)?.name ?? "Miembro no disponible")
      : "Sin responsable";
  }
  function taskList(tasks, stage) {
    return (
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="flex min-w-0 items-start gap-3">
            <input
              className="mt-2 size-5 shrink-0"
              type="checkbox"
              aria-label={`Completar ${task.title}`}
              checked={task.status === "completed"}
              disabled={busy}
              onChange={(e) =>
                perform(
                  () =>
                    tasksApi.update(
                      task.id,
                      taskPayload(
                        { ...task, status: e.target.checked ? "completed" : "todo" },
                        task.revision,
                      ),
                    ),
                  false,
                  true,
                )
              }
            />
            <div className="min-w-0 flex-1">
              <button
                type="button"
                className="w-full break-words text-left text-sm text-stone-200 underline-offset-4 hover:underline"
                onClick={() => open("task", task, stage)}
              >
                {task.title}
              </button>
              <p className="mt-1 text-xs text-stone-400">
                {assignee(task.assigned_user_id)} · {task.due_date || "Sin fecha"}
                {task.status === "cancelled" ? " · Cancelada" : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  }
  function checklistList(checklists) {
    return (
      <div className="space-y-4">
        {checklists.map((check) => (
          <fieldset key={check.id}>
            <legend className="mb-2 text-sm font-medium text-stone-300">{check.name}</legend>
            {check.items?.map((item) => (
              <label
                key={item.id}
                className="flex min-h-11 items-center gap-3 text-sm text-stone-400"
              >
                <input
                  className="size-5 shrink-0"
                  type="checkbox"
                  checked={item.is_completed}
                  disabled={busy}
                  onChange={(e) =>
                    perform(() => checklistsApi.toggleItem(item.id, e.target.checked))
                  }
                />
                <span className="min-w-0 break-words">{item.title}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    );
  }
  const stages = data?.stages ?? [];
  const next = stages.find((s) => !["completed", "skipped"].includes(s.status));
  const pending =
    stages.reduce((sum, s) => sum + s.pending_tasks, 0) +
    (data?.tasks ?? []).filter((t) => ["todo", "in_progress", "waiting"].includes(t.status)).length;
  const totalProgress = stages.length
    ? Math.round(
        stages.reduce((sum, s) => sum + (s.status === "skipped" ? 100 : s.progress), 0) /
          stages.length,
      )
    : 0;
  return (
    <section
      aria-label="Postproducción"
      className="space-y-5 [&_button]:min-h-11 [&_select]:min-h-11"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Postproducción y plantillas</h2>
          <p className="mt-2 text-sm text-stone-400">
            Organiza el trabajo. Los archivos se importan, editan y exportan en tus herramientas
            habituales.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "board" ? "primary" : "secondary"}
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
          >
            Panel de postproducción
          </Button>
          <Button
            variant={view === "templates" ? "primary" : "secondary"}
            aria-pressed={view === "templates"}
            onClick={() => setView("templates")}
          >
            Plantillas
          </Button>
        </div>
      </div>
      <nav aria-label="Conexiones de producción" className="flex flex-wrap gap-2">
        {[
          ["briefing", "Briefing"],
          ["production", "Tomas y jornadas"],
          ["planning", "Equipo y tareas"],
          ["deliveries", "Entregas externas"],
        ].map(([key, label]) => (
          <Button key={key} variant="ghost" onClick={() => onSectionChange?.(key)}>
            {label}
          </Button>
        ))}
      </nav>
      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setError("");
            load();
            if (view === "templates") loadCatalog();
          }}
        />
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-200">
          {message}
        </p>
      )}
      {loading && !data && <p role="status">Cargando postproducción...</p>}
      {view === "board" && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Pendientes", `${pending} tarea${pending === 1 ? "" : "s"}`],
              ["Entrega prevista", job.delivery_due_date || "Sin fecha de entrega"],
              [
                "Próximo paso",
                next?.label || (stages.length ? "Revisar entrega final" : "Preparar pipeline"),
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-stone-400">{label}</p>
                <p className="mt-2 break-words font-medium">{value}</p>
              </div>
            ))}
          </div>
          <label className="block text-sm text-stone-400">
            Progreso de etapas: {totalProgress}%
            <progress
              className="mt-2 block h-3 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:bg-amber-200 [&::-moz-progress-bar]:bg-amber-200"
              value={totalProgress}
              max={100}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} variant="secondary" onClick={() => open("stage")}>
              Añadir etapa
            </Button>
            <Button disabled={busy} variant="secondary" onClick={() => open("task")}>
              Añadir tarea al proyecto
            </Button>
            <Button disabled={busy} variant="secondary" onClick={() => open("checklist")}>
              Añadir checklist al proyecto
            </Button>
            {!stages.length && (
              <Button disabled={busy} onClick={() => open("initialize")}>
                Preparar ocho etapas
              </Button>
            )}
          </div>
          {!stages.length && (
            <p className="rounded-xl border border-dashed border-white/20 p-5 text-stone-400">
              El proyecto conserva su workflow actual. Prepara las ocho etapas o previsualiza una
              plantilla para organizar la postproducción.
            </p>
          )}
          <div className="grid gap-5 xl:grid-cols-2">
            {stages.map((stage) => (
              <article
                key={stage.id}
                aria-label={`Etapa ${stage.label}`}
                className="min-w-0 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div>
                  <h3 className="text-lg font-semibold">{stage.label}</h3>
                  <p className="mt-1 text-xs text-stone-400">
                    {assignee(stage.assigned_user_id)} · {stage.due_date || "Sin fecha"} ·{" "}
                    {stage.pending_tasks} tarea{stage.pending_tasks === 1 ? "" : "s"} pendiente
                    {stage.pending_tasks === 1 ? "" : "s"}
                  </p>
                </div>
                <Field label={`Estado de ${stage.label}`}>
                  <Select
                    disabled={busy}
                    value={stage.status}
                    options={stageStatuses}
                    onChange={(e) =>
                      perform(() =>
                        workflowsApi.updateStage(job.id, stage.id, {
                          status: e.target.value,
                          revision: stage.revision,
                        }),
                      )
                    }
                  />
                </Field>
                <label className="block text-xs text-stone-400">
                  Progreso de etapa: {stage.progress}%
                  <progress
                    className="mt-2 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:bg-amber-200 [&::-moz-progress-bar]:bg-amber-200"
                    value={stage.progress}
                    max={100}
                  />
                </label>
                {stage.notes && (
                  <p className="whitespace-pre-wrap break-words text-sm text-stone-300">
                    {stage.notes}
                  </p>
                )}
                {taskList(stage.tasks, stage)}
                {checklistList(stage.checklists)}
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy} variant="secondary" onClick={() => open("stage", stage)}>
                    Editar etapa
                  </Button>
                  <Button disabled={busy} variant="ghost" onClick={() => open("task", null, stage)}>
                    Añadir tarea
                  </Button>
                  <Button
                    disabled={busy}
                    variant="ghost"
                    onClick={() => open("checklist", null, stage)}
                  >
                    Añadir checklist
                  </Button>
                  <Button
                    disabled={busy}
                    variant="ghost"
                    aria-label={`Subir etapa ${stage.label}`}
                    onClick={() =>
                      perform(() => workflowsApi.moveStage(job.id, stage.id, "up", stage.revision))
                    }
                  >
                    ↑ Subir
                  </Button>
                  <Button
                    disabled={busy}
                    variant="ghost"
                    aria-label={`Bajar etapa ${stage.label}`}
                    onClick={() =>
                      perform(() =>
                        workflowsApi.moveStage(job.id, stage.id, "down", stage.revision),
                      )
                    }
                  >
                    ↓ Bajar
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {data.tasks.length > 0 && (
            <div className="space-y-4 rounded-xl border border-white/10 p-5">
              <h3 className="text-lg font-semibold">Preparación y tareas del proyecto</h3>
              {taskList(data.tasks)}
            </div>
          )}
          {data.checklists.length > 0 && (
            <div className="space-y-4 rounded-xl border border-white/10 p-5">
              <h3 className="text-lg font-semibold">Checklists del proyecto</h3>
              {checklistList(data.checklists)}
            </div>
          )}
        </>
      )}
      {view === "templates" && (
        <div className="space-y-5">
          <p className="text-sm text-stone-400">
            Las plantillas crean organización, sin inventar fechas, responsables ni recursos.
            Aplicarlas no sustituye el briefing ni modifica el estado comercial. Guardar una
            plantilla no cambia proyectos anteriores.
          </p>
          <Button disabled={busy} onClick={() => open("template", null, null, true)}>
            Nueva plantilla propia
          </Button>
          {catalogLoading && <p role="status">Cargando plantillas...</p>}
          {catalog && (
            <>
              <h3 className="text-lg font-semibold">Plantillas profesionales</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {[...catalog.builtins, ...catalog.data].map((template) => (
                  <article
                    key={template.key}
                    aria-label={`Plantilla ${template.name}`}
                    className="min-w-0 rounded-xl border border-white/10 p-5"
                  >
                    <h4 className="text-lg font-semibold">{template.name}</h4>
                    <p className="mt-2 break-words text-sm text-stone-400">
                      {template.description}
                    </p>
                    <p className="mt-2 text-xs text-stone-400">
                      {template.key.startsWith("custom-") ? "Del estudio" : "Inicial"} ·{" "}
                      {template.definition.stages.length} etapas
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button disabled={busy} onClick={() => preview(template)}>
                        Previsualizar
                      </Button>
                      <Button
                        disabled={busy}
                        variant="secondary"
                        onClick={() => open("template", template, null, true)}
                      >
                        Duplicar y editar
                      </Button>
                      {template.key.startsWith("custom-") && (
                        <Button
                          disabled={busy}
                          variant="ghost"
                          onClick={() => open("template", template)}
                        >
                          Editar plantilla
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              <Pagination meta={catalog.meta} onPage={setPage} />
            </>
          )}
        </div>
      )}
      <Modal
        open={Boolean(editor)}
        title={modalTitles[editor?.kind] || "Postproducción"}
        onClose={close}
      >
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-200">
            {error}
          </p>
        )}
        {conflict && (
          <Button
            disabled={busy}
            variant="secondary"
            onClick={() => {
              setEditor(null);
              setConflict(false);
              load();
              if (view === "templates") loadCatalog();
            }}
          >
            Descartar borrador y recargar
          </Button>
        )}
        {editor?.kind === "preview" && (
          <div className="space-y-5">
            <h3 className="text-xl font-semibold">{editor.preview.template.name}</h3>
            <p className="text-sm text-stone-400">
              Se conservarán datos, fechas, responsables y estados existentes. Las tareas
              coincidentes pueden vincularse a su etapa sin reiniciarlas; las checklists existentes
              conservan su ubicación.
            </p>
            {editor.preview.already_applied && (
              <p role="status">
                Esta plantilla ya se aplicó a este proyecto. No se crearán elementos nuevos. Duplica
                la plantilla o añade tareas manualmente si necesitas otra variante.
              </p>
            )}
            {[
              ["stages", "Etapas"],
              ["tasks", "Tareas"],
              ["checklists", "Checklists"],
            ].map(([key, label]) => (
              <details key={key} open={key === "stages"}>
                <summary className="cursor-pointer font-medium">
                  {label} · {editor.preview.plan[key].filter((p) => p.action === "create").length}{" "}
                  nuevos / {editor.preview.plan[key].filter((p) => p.action === "reuse").length}{" "}
                  existentes
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-stone-300">
                  {editor.preview.plan[key].map((item, index) => (
                    <li key={index} className="break-words">
                      {actionLabels[item.action]}: {item.label || item.title || item.name}
                      {item.items && (
                        <ul className="ml-4 mt-1 list-disc">
                          {(item.item_actions ?? item.items.map((title) => ({ title }))).map(
                            (control, i) => (
                              <li key={i}>
                                {control.action ? `${actionLabels[control.action]}: ` : ""}
                                {control.title}
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={editor.confirmed}
                onChange={(e) =>
                  setEditor((current) => ({ ...current, confirmed: e.target.checked }))
                }
              />
              He revisado los elementos de esta aplicación
            </label>
            <Button
              disabled={busy || !editor.confirmed || editor.preview.already_applied}
              onClick={() =>
                perform(
                  () =>
                    workflowsApi.apply(job.id, editor.preview.template.key, editor.preview.hash),
                  true,
                  true,
                )
              }
            >
              Confirmar aplicación
            </Button>
          </div>
        )}
        {editor?.kind === "initialize" && (
          <div className="space-y-4">
            <p>
              Se crearán las etapas que falten: importación pendiente, selección, edición, revisión
              interna, revisión del cliente, correcciones, exportación y entrega completada. Sin
              tareas ni fechas automáticas.
            </p>
            <Button
              disabled={busy}
              onClick={() => perform(() => workflowsApi.initialize(job.id), true)}
            >
              Confirmar preparación
            </Button>
          </div>
        )}
        {editor?.kind === "template" && (
          <WorkflowTemplateEditor
            form={editor.form}
            setForm={setForm}
            saving={busy}
            onSubmit={save}
          />
        )}
        {editor?.kind === "task" && (
          <fieldset disabled={busy}>
            <TaskForm
              form={editor.form}
              setForm={setForm}
              onSubmit={save}
              saving={busy}
              members={members}
              sessions={job.sessions ?? []}
              clients={job.client ? [job.client] : []}
            />
          </fieldset>
        )}
        {editor?.kind === "stage" && (
          <form onSubmit={save} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4">
              <Field label="Nombre de etapa">
                <Input
                  required
                  maxLength={120}
                  value={editor.form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
              </Field>
              <Field label="Estado de la etapa">
                <Select
                  value={editor.form.status}
                  options={stageStatuses}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                />
              </Field>
              <Field label="Responsable de la etapa">
                <Select
                  value={editor.form.assigned_user_id}
                  options={[
                    { value: "", label: "Sin responsable" },
                    ...members.map((m) => ({ value: m.id, label: m.name })),
                    ...(editor.form.assigned_user_id &&
                    !members.some((m) => m.id === Number(editor.form.assigned_user_id))
                      ? [{ value: editor.form.assigned_user_id, label: "Miembro no disponible" }]
                      : []),
                  ]}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_user_id: e.target.value }))}
                />
              </Field>
              <Field label="Fecha de la etapa">
                <Input
                  type="date"
                  value={editor.form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </Field>
              <Field label="Observaciones de la etapa">
                <Textarea
                  rows={4}
                  maxLength={4000}
                  value={editor.form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>
            </fieldset>
            <Button disabled={busy}>Guardar etapa</Button>
          </form>
        )}
        {editor?.kind === "checklist" && (
          <form onSubmit={save} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4">
              <Field label="Nombre de la checklist">
                <Input
                  required
                  maxLength={120}
                  value={editor.form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="Controles (uno por línea)">
                <Textarea
                  required
                  rows={5}
                  maxLength={3600}
                  value={editor.form.items}
                  onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))}
                />
              </Field>
            </fieldset>
            <Button disabled={busy}>Guardar checklist</Button>
          </form>
        )}
        {discard && (
          <div className="mt-4 space-y-3 rounded-lg border border-amber-200/30 p-4">
            <p>Hay cambios sin guardar.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setDiscard(false)}>
                Seguir editando
              </Button>
              <Button
                onClick={() => {
                  setEditor(null);
                  setDiscard(false);
                }}
              >
                Descartar cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
