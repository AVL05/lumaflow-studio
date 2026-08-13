import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiError } from "../api/client";
import { jobsApi } from "../api/jobs";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { ErrorState } from "../components/states/ErrorState";
import { useToast } from "../features/notifications/ToastContext";

const statusLabels = { lead: "Lead", quoted: "Presupuesto", contract_pending: "Contrato", confirmed: "Confirmado", preparation: "Preparación", shoot: "Sesión", editing: "Edición", review: "Revisión", delivered: "Entregado", closed: "Cerrado", cancelled: "Cancelado" };
const contractLabels = { not_required: "No requerido", draft: "Borrador", sent: "Enviado", signed: "Firmado", declined: "Rechazado" };

export function JobDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const toast = useToast();
  const [job, setJob] = useState(null); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { try { setJob(await jobsApi.show(id)); setError(""); } catch (err) { setError(getApiError(err)); } }, [id]);
  useEffect(() => { load(); }, [load]);
  async function update(fields) { setSaving(true); try { const payload = { client_id: job.client_id, location_id: job.location_id, title: job.title, specialty: job.specialty, workflow_key: job.workflow_key, status: job.status, event_date: job.event_date, description: job.description, budget: job.budget, deposit_amount: job.deposit_amount, contract_status: job.contract_status, contract_url: job.contract_url, gear_item_ids: job.gear_items?.map((item) => item.id) ?? [], ...fields }; setJob(await jobsApi.update(job.id, payload)); toast.success("Trabajo actualizado."); } catch (err) { toast.error(getApiError(err)); } finally { setSaving(false); } }
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!job) return <p className="text-sm text-stone-400">Cargando trabajo...</p>;

  return <div className="space-y-6">
    <div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_8%_0%,rgba(245,211,141,.12),transparent_28rem),#11100e] p-6 md:p-8">
      <button type="button" onClick={() => navigate("/app/jobs")} className="text-sm text-stone-500 hover:text-amber-100">← Pipeline</button>
      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-200/80">{job.specialty}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-50 md:text-4xl">{job.title}</h1><p className="mt-2 text-sm text-stone-400">{job.client?.name || "Cliente pendiente"} · {job.event_date ? new Date(`${job.event_date}T12:00:00`).toLocaleDateString("es-ES", { dateStyle: "long" }) : "Fecha pendiente"}</p></div><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-stone-500">Estado<Select disabled={saving} value={job.status} onChange={(event) => update({ status: event.target.value })} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} /></label><label className="text-xs text-stone-500">Contrato<Select disabled={saving} value={job.contract_status} onChange={(event) => update({ contract_status: event.target.value })} options={Object.entries(contractLabels).map(([value, label]) => ({ value, label }))} /></label></div></div>
      <div className="mt-7 flex flex-wrap gap-2"><Action to={`/app/quotes?create=1&job_id=${job.id}&client_id=${job.client_id ?? ""}`}>Presupuesto</Action><Action to={`/app/sessions?create=1&job_id=${job.id}`}>Sesión</Action><Action to={`/app/tasks?create=1&job_id=${job.id}&client_id=${job.client_id ?? ""}`}>Tarea</Action><Action to={`/app/deliveries?create=1&job_id=${job.id}&client_id=${job.client_id ?? ""}`}>Entrega</Action></div>
    </div>

    <div className="grid gap-5 xl:grid-cols-3">
      <Panel title="Resumen"><Fact label="Cliente" value={job.client?.name || "Sin asignar"} /><Fact label="Fecha" value={job.event_date || "Sin fecha"} /><Fact label="Localización" value={job.location?.name || "Sin asignar"} /><Fact label="Workflow" value={job.workflow_key} />{job.description ? <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-stone-400">{job.description}</p> : null}</Panel>
      <Panel title="Negocio"><Fact label="Presupuesto" value={money(job.budget)} /><Fact label="Señal" value={money(job.deposit_amount)} /><Fact label="Contrato" value={contractLabels[job.contract_status]} />{job.contract_url ? <a className="mt-3 inline-block text-sm text-amber-200 hover:underline" href={job.contract_url} target="_blank" rel="noreferrer">Abrir contrato</a> : null}<Collection items={job.quotes} empty="Sin presupuestos" render={(quote) => <Link key={quote.id} to="/app/quotes" className="flex justify-between text-sm text-stone-300"><span>{quote.quote_number}</span><span>{money(quote.total)}</span></Link>} /><Collection items={job.invoices} empty="Sin facturas" render={(invoice) => <Link key={invoice.id} to="/app/invoices" className="flex justify-between text-sm text-stone-300"><span>{invoice.invoice_number}</span><span>{invoice.status}</span></Link>} /></Panel>
      <Panel title="Producción"><Fact label="Sesiones" value={String(job.sessions.length)} /><Fact label="Equipo" value={job.gear_items?.map((item) => item.name).join(", ") || "Sin asignar"} /><Fact label="Entregas" value={String(job.deliveries.length)} />{job.deliveries.map((delivery) => <Link key={delivery.id} to={`/app/deliveries/${delivery.id}`} className="mt-3 block rounded-lg border border-white/10 p-3 text-sm text-stone-300 hover:border-amber-200/20">{delivery.title}<span className="float-right text-stone-500">{delivery.status}</span></Link>)}</Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title={`Tareas · ${job.tasks.filter((task) => !["completed", "cancelled"].includes(task.status)).length} pendientes`}><Collection items={job.tasks} empty="Sin tareas" render={(task) => <div key={task.id} className="flex items-start justify-between gap-4 border-b border-white/8 py-3 last:border-0"><div><p className={`text-sm ${task.status === "completed" ? "text-stone-600 line-through" : "text-stone-200"}`}>{task.title}</p><p className="mt-1 text-xs text-stone-600">{task.due_date || "Sin fecha"}</p></div><span className="text-xs text-stone-500">{task.status}</span></div>} /></Panel>
      <Panel title="Timeline"><Collection items={job.activities} empty="La actividad aparecerá aquí" render={(activity) => <div key={activity.id} className="relative border-l border-white/10 pb-5 pl-5 last:pb-0"><span className="absolute -left-1 top-1 size-2 rounded-full bg-amber-200/70"/><p className="text-sm text-stone-300">{activity.description || activity.type}</p><p className="mt-1 text-xs text-stone-600">{activity.created_at ? new Date(activity.created_at).toLocaleString("es-ES") : ""}</p></div>} /></Panel>
    </div>
  </div>;
}

function Panel({ title, children }) { return <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h2 className="text-base font-semibold text-stone-100">{title}</h2><div className="mt-4">{children}</div></section>; }
function Fact({ label, value }) { return <div className="flex justify-between gap-4 border-b border-white/8 py-2.5 text-sm last:border-0"><span className="text-stone-500">{label}</span><span className="text-right text-stone-200">{value}</span></div>; }
function Collection({ items = [], empty, render }) { return <div className="mt-4 space-y-3">{items.length ? items.map(render) : <p className="text-sm text-stone-600">{empty}</p>}</div>; }
function Action({ to, children }) { return <Link to={to}><Button variant="secondary">+ {children}</Button></Link>; }
function money(value) { return value === null || value === undefined ? "Sin definir" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value)); }
