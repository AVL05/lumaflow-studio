import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";

export function JobForm({ form, setForm, clients, workflows, onSubmit, saving, error }) {
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const workflowOptions = Object.entries(workflows ?? {}).map(([value, item]) => ({ value, label: item.label }));

  return <form onSubmit={onSubmit} className="space-y-5">
    {error ? <p className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
    <label className="block text-sm text-stone-300">Nombre del trabajo<Input required value={form.title} onChange={update("title")} placeholder="Boda Laura + Carlos" /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm text-stone-300">Cliente<Select value={form.client_id} onChange={update("client_id")} options={[{ value: "", label: "Sin asignar" }, ...clients.map((client) => ({ value: client.id, label: client.name }))]} /></label>
      <label className="block text-sm text-stone-300">Fecha<Input type="date" value={form.event_date} onChange={update("event_date")} /></label>
      <label className="block text-sm text-stone-300">Especialidad<Select value={form.specialty} onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value, workflow_key: event.target.value }))} options={workflowOptions} /></label>
      <label className="block text-sm text-stone-300">Workflow<Select value={form.workflow_key} onChange={update("workflow_key")} options={workflowOptions} /></label>
      <label className="block text-sm text-stone-300">Presupuesto<Input type="number" min="0" step="0.01" value={form.budget} onChange={update("budget")} placeholder="0,00" /></label>
      <label className="block text-sm text-stone-300">Señal requerida<Input type="number" min="0" step="0.01" value={form.deposit_amount} onChange={update("deposit_amount")} /></label>
    </div>
    <label className="block text-sm text-stone-300">Notas del trabajo<Textarea rows="4" value={form.description} onChange={update("description")} placeholder="Briefing, necesidades y contexto..." /></label>
    <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-stone-300"><input type="checkbox" className="mt-1" checked={form.create_workflow_tasks} onChange={(event) => setForm((current) => ({ ...current, create_workflow_tasks: event.target.checked }))} /><span><strong className="block text-stone-100">Crear tareas del workflow</strong>Genera una preparación inicial adaptada a la especialidad.</span></label>
    <Button disabled={saving}>{saving ? "Guardando..." : "Crear trabajo"}</Button>
  </form>;
}
