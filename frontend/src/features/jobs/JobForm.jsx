import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { projectTypes } from "./jobFormUtils";
import { ProjectOrganizationFields } from "./ProjectOrganizationFields";
import { ProjectResourcePicker } from "./ProjectResourcePicker";

export function JobForm({ form, setForm, workflows, onSubmit, saving, error, jobId }) {
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const workflowOptions = Object.entries(workflows ?? {}).map(([value, item]) => ({
    value,
    label: item.label,
  }));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <fieldset disabled={saving} className="min-w-0 space-y-5">
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        ) : null}
        <label className="block text-sm text-stone-300">
          Nombre del proyecto
          <Input
            required
            value={form.title}
            onChange={update("title")}
            placeholder="Boda Laura + Carlos"
          />
        </label>
        <label className="block text-sm text-stone-300">
          Tipo de proyecto
          <Select
            value={form.project_type}
            options={projectTypes}
            onChange={update("project_type")}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ProjectResourcePicker
              jobId={jobId}
              resource="clients"
              label="Cliente (opcional)"
              single
              selected={form.client_id ? [Number(form.client_id)] : []}
              onChange={(ids) => setForm((current) => ({ ...current, client_id: ids[0] ?? "" }))}
            />
          </div>
          <label className="block text-sm text-stone-300">
            Fecha
            <Input type="date" value={form.event_date} onChange={update("event_date")} />
          </label>
          <label className="block text-sm text-stone-300">
            Especialidad
            <Select
              value={form.specialty}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  specialty: event.target.value,
                  workflow_key: event.target.value,
                }))
              }
              options={workflowOptions}
            />
          </label>
          <label className="block text-sm text-stone-300">
            Workflow
            <Select
              value={form.workflow_key}
              onChange={update("workflow_key")}
              options={workflowOptions}
            />
          </label>
          <label className="block text-sm text-stone-300">
            Presupuesto
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={update("budget")}
              placeholder="0,00"
            />
          </label>
          <label className="block text-sm text-stone-300">
            Señal requerida
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.deposit_amount}
              onChange={update("deposit_amount")}
            />
          </label>
        </div>
        <label className="block text-sm text-stone-300">
          Descripción
          <Textarea
            rows="4"
            value={form.description}
            onChange={update("description")}
            placeholder="Idea y contexto del proyecto..."
          />
        </label>
        <ProjectOrganizationFields form={form} setForm={setForm} jobId={jobId} />
        {!jobId && (
          <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-stone-300">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.create_workflow_tasks}
              onChange={(event) =>
                setForm((current) => ({ ...current, create_workflow_tasks: event.target.checked }))
              }
            />
            <span>
              <strong className="block text-stone-100">Crear tareas del workflow</strong>Genera una
              preparación inicial adaptada a la especialidad.
            </span>
          </label>
        )}
      </fieldset>
      <Button disabled={saving}>
        {saving ? "Guardando..." : jobId ? "Guardar proyecto" : "Crear proyecto"}
      </Button>
    </form>
  );
}
