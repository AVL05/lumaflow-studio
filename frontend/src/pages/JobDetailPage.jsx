import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link, useBlocker, useBeforeUnload, useParams } from "react-router-dom";
import { getApiError } from "../api/client";
import { jobsApi } from "../api/jobs";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { ErrorState } from "../components/states/ErrorState";
import { ProjectBriefingEditor } from "../features/jobs/ProjectBriefingEditor";
import { JobForm } from "../features/jobs/JobForm";
import {
  jobToForm,
  normalizeJob,
  projectTypes,
  productionPhases,
} from "../features/jobs/jobFormUtils";
import { useToast } from "../features/notifications/ToastContext";

const statusLabels = {
  lead: "Idea / contacto",
  quoted: "Presupuesto",
  contract_pending: "Contrato",
  confirmed: "Confirmado",
  preparation: "Preparación",
  shoot: "Rodaje / sesión",
  editing: "Edición",
  review: "Revisión",
  delivered: "Entregado",
  closed: "Cerrado",
  cancelled: "Cancelado",
};
const ProductionWorkspace = lazy(() =>
  import("../features/production/ProductionWorkspace").then((module) => ({
    default: module.ProductionWorkspace,
  })),
);
const PostproductionWorkspace = lazy(() =>
  import("../features/workflows/PostproductionWorkspace").then((module) => ({
    default: module.PostproductionWorkspace,
  })),
);
const contractLabels = {
  not_required: "No requerido",
  draft: "Borrador",
  sent: "Enviado",
  signed: "Firmado",
  declined: "Rechazado",
};
const sections = [
  ["overview", "Resumen"],
  ["briefing", "Briefing"],
  ["planning", "Planificación"],
  ["production", "Tomas y rodaje"],
  ["postproduction", "Postproducción"],
  ["deliveries", "Entregas"],
  ["business", "Gestión comercial"],
];

export function JobDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("overview");
  const [briefDirty, setBriefDirty] = useState(false);
  const [productionDirty, setProductionDirty] = useState(false);
  const [productionOpened, setProductionOpened] = useState(false);
  const [workflowDirty, setWorkflowDirty] = useState(false);
  const [workflowOpened, setWorkflowOpened] = useState(false);
  const [edit, setEdit] = useState(null);
  const [formError, setFormError] = useState("");
  const [catalog, setCatalog] = useState({ workflows: {} });
  const [discardEdit, setDiscardEdit] = useState(false);
  const load = useCallback(async () => {
    try {
      setJob(await jobsApi.show(id));
      setError("");
    } catch (err) {
      setError(getApiError(err));
    }
  }, [id]);
  useEffect(() => {
    setJob(null);
    setSection("overview");
    setBriefDirty(false);
    setProductionDirty(false);
    setProductionOpened(false);
    setWorkflowDirty(false);
    setWorkflowOpened(false);
    setEdit(null);
    setFormError("");
    setDiscardEdit(false);
    load();
  }, [load]);
  const organizationDirty = edit && job && JSON.stringify(edit) !== JSON.stringify(jobToForm(job));
  const dirty = briefDirty || productionDirty || workflowDirty || Boolean(organizationDirty);
  const blocker = useBlocker(dirty);
  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [dirty],
    ),
  );

  async function update(fields) {
    setSaving(true);
    setFormError("");
    try {
      const updated = await jobsApi.update(job.id, normalizeJob({ ...jobToForm(job), ...fields }));
      setJob(updated);
      setEdit(null);
      toast.success("Proyecto actualizado.");
    } catch (err) {
      setFormError(getApiError(err));
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }
  async function openEdit() {
    setFormError("");
    setDiscardEdit(false);
    try {
      setCatalog(await jobsApi.workflows());
      setEdit(jobToForm(job));
    } catch (err) {
      toast.error(getApiError(err));
    }
  }
  function closeEdit() {
    if (saving) return;
    if (organizationDirty) setDiscardEdit(true);
    else setEdit(null);
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!job)
    return (
      <p role="status" className="text-sm text-stone-400">
        Cargando proyecto...
      </p>
    );
  const locations = [
    ...new Map(
      [
        job.location,
        ...(job.locations ?? []),
        ...(job.sessions ?? []).map((session) => session.location),
      ]
        .filter(Boolean)
        .map((location) => [location.id, location]),
    ).values(),
  ];
  return (
    <div className="min-w-0 space-y-6">
      <header className="rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_top_left,rgba(211,184,125,.12),transparent_60%),#11110f] p-5 sm:p-8">
        <Link to="/app/jobs" className="text-sm text-stone-400 hover:text-amber-100">
          ← Proyectos
        </Link>
        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[.2em] text-amber-200/80">
              {projectTypes.find((type) => type.value === job.project_type)?.label ?? "Fotográfico"}{" "}
              · {job.specialty}
            </p>
            <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">
              {job.title}
            </h1>
            <p className="mt-3 text-sm text-stone-400">
              {job.client?.name || "Proyecto sin cliente"} · {job.event_date || "Fecha por definir"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-40 text-xs text-stone-400">
              Estado del proyecto
              <Select
                disabled={saving}
                value={job.status}
                onChange={(e) => update({ status: e.target.value })}
                options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
              />
            </label>
            <Button variant="secondary" disabled={saving} onClick={openEdit}>
              Editar proyecto
            </Button>
          </div>
        </div>
        <ol aria-label="Fases de producción" className="mt-7 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {productionPhases.map((phase, index) => (
            <li
              key={phase.value}
              aria-current={job.production_phase === phase.value ? "step" : undefined}
              className={`rounded-xl border p-3 text-sm ${job.production_phase === phase.value ? "border-amber-200/40 bg-amber-100/10 text-amber-100" : "border-white/10 text-stone-400"}`}
            >
              <span className="mr-2 text-xs opacity-60">0{index + 1}</span>
              {phase.label}
            </li>
          ))}
        </ol>
        {job.status === "cancelled" && (
          <p className="mt-3 text-sm text-stone-400">Proyecto cancelado</p>
        )}
      </header>
      {formError && !edit && (
        <p role="alert" className="text-sm text-red-200">
          {formError}
        </p>
      )}
      <nav
        aria-label="Secciones del proyecto"
        className="flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        {sections.map(([value, label]) => (
          <Button
            key={value}
            variant={section === value ? "primary" : "ghost"}
            aria-pressed={section === value}
            onClick={() => {
              setSection(value);
              if (value === "production") setProductionOpened(true);
              if (value === "postproduction") setWorkflowOpened(true);
            }}
          >
            {label}
            {value === "briefing" && briefDirty ? " · sin guardar" : ""}
            {value === "production" && productionDirty ? " · sin guardar" : ""}
            {value === "postproduction" && workflowDirty ? " · sin guardar" : ""}
          </Button>
        ))}
      </nav>

      <div hidden={section !== "overview"} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Intención del proyecto">
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-stone-300">
              {job.description || "Añade una descripción para dar contexto a tu proyecto."}
            </p>
            <Fact label="Cliente" value={job.client?.name || "No asociado"} />
            <Fact label="Inicio" value={job.start_date || "Por definir"} />
            <Fact label="Fin" value={job.end_date || "Por definir"} />
            <Fact label="Entrega prevista" value={job.delivery_due_date || "Por definir"} />
          </Panel>
          <Panel title="Participantes">
            <Collection
              items={job.participants}
              empty="Añade a las personas que participan en el proyecto."
              render={(person, index) => (
                <div key={index} className="py-2">
                  <p className="font-medium text-stone-200">{person.name}</p>
                  <p className="text-sm text-stone-400">{person.role || "Función por definir"}</p>
                </div>
              )}
            />
          </Panel>
        </div>
        <Panel title="Enlaces de referencia">
          <Collection
            items={job.external_links}
            empty="Añade enlaces a documentos, referencias o carpetas externas."
            render={(link, index) => (
              <ExternalLink key={index} url={link.url}>
                {link.label}
              </ExternalLink>
            )}
          />
        </Panel>
        <Panel title="Actividad">
          <Collection
            items={job.activities}
            empty="La actividad del proyecto aparecerá aquí."
            render={(activity) => (
              <div key={activity.id} className="border-l border-amber-100/30 pl-4 text-sm">
                <p className="text-stone-300">{activity.description || activity.type}</p>
                <p className="mt-1 text-xs text-stone-400">
                  {activity.created_at ? new Date(activity.created_at).toLocaleString("es-ES") : ""}
                </p>
              </div>
            )}
          />
        </Panel>
      </div>
      <div
        hidden={section !== "briefing"}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6"
      >
        <ProjectBriefingEditor
          key={job.id}
          job={job}
          onSaved={setJob}
          onDirtyChange={setBriefDirty}
        />
      </div>
      <div hidden={section !== "postproduction"}>
        {workflowOpened && (
          <Suspense fallback={<p role="status">Cargando postproducción...</p>}>
            <PostproductionWorkspace
              key={job.id}
              job={job}
              onRefresh={load}
              onDirtyChange={setWorkflowDirty}
              onSectionChange={(value) => {
                setSection(value);
                if (value === "production") setProductionOpened(true);
              }}
            />
          </Suspense>
        )}
      </div>
      <div hidden={section !== "production"}>
        {productionOpened && (
          <Suspense fallback={<p role="status">Cargando producción...</p>}>
            <ProductionWorkspace
              key={job.id}
              job={job}
              onRefresh={load}
              onDirtyChange={setProductionDirty}
            />
          </Suspense>
        )}
      </div>
      <div hidden={section !== "planning"} className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <Action to={`/app/tasks?create=1&job_id=${job.id}&client_id=${job.client_id ?? ""}`}>
            Añadir tarea
          </Action>
          <Action to={`/app/sessions?create=1&job_id=${job.id}`}>Añadir sesión o rodaje</Action>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Tareas">
            <Collection
              items={job.tasks}
              empty="Prepara el siguiente paso creando una tarea."
              render={(task) => (
                <div
                  key={task.id}
                  className="flex justify-between gap-3 border-b border-white/10 py-3 text-sm"
                >
                  <div>
                    <p
                      className={
                        task.status === "completed"
                          ? "text-stone-500 line-through"
                          : "text-stone-200"
                      }
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">{task.due_date || "Sin fecha"}</p>
                  </div>
                  <span className="text-stone-400">{task.status}</span>
                </div>
              )}
            />
          </Panel>
          <Panel title="Sesiones y rodajes">
            <Collection
              items={job.sessions}
              empty="Todavía no hay sesiones vinculadas."
              render={(session) => (
                <div key={session.id} className="text-sm">
                  <p className="text-stone-200">{session.name}</p>
                  <p className="mt-1 text-stone-400">
                    {session.date} ·{" "}
                    {session.location?.name || session.location_name || "Localización por definir"}
                  </p>
                </div>
              )}
            />
          </Panel>
          <Panel title="Localizaciones">
            <Collection
              items={locations}
              empty="Selecciona localizaciones desde Editar proyecto."
              render={(location) => (
                <Link
                  key={location.id}
                  to={`/app/locations/${location.id}`}
                  className="block text-sm text-amber-100 hover:underline"
                >
                  {location.name}
                </Link>
              )}
            />
          </Panel>
          <Panel title="Equipo necesario">
            <Collection
              items={job.gear_items}
              empty="Selecciona equipo desde Editar proyecto."
              render={(item) => (
                <p key={item.id} className="text-sm text-stone-200">
                  {item.name}
                </p>
              )}
            />
          </Panel>
        </div>
      </div>
      <div hidden={section !== "deliveries"} className="space-y-5">
        <Action to={`/app/deliveries?create=1&job_id=${job.id}&client_id=${job.client_id ?? ""}`}>
          Nueva entrega externa
        </Action>
        <Panel title="Entregas">
          <p className="text-sm text-stone-400">
            El material permanece en el proveedor original y conserva sus permisos.
          </p>
          <Collection
            items={job.deliveries}
            empty="Todavía no hay entregas vinculadas."
            render={(delivery) => (
              <Link
                key={delivery.id}
                to={`/app/deliveries/${delivery.id}`}
                className="flex justify-between gap-3 rounded-xl border border-white/10 p-4 text-sm text-stone-200 hover:border-amber-200/40"
              >
                <span>{delivery.title}</span>
                <span>{delivery.status}</span>
              </Link>
            )}
          />
        </Panel>
      </div>
      <div hidden={section !== "business"} className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <Action to={`/app/quotes?create=1&job_id=${job.id}&client_id=${job.client_id ?? ""}`}>
            Presupuesto
          </Action>
          <Action to={`/app/contracts?create=1&job_id=${job.id}&client_id=${job.client_id ?? ""}`}>
            Contrato
          </Action>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Gestión comercial">
            <Fact label="Presupuesto" value={money(job.budget)} />
            <Fact label="Señal" value={money(job.deposit_amount)} />
            <label className="mt-4 block text-sm text-stone-400">
              Estado del contrato
              <Select
                disabled={saving}
                value={job.contract_status}
                onChange={(e) => update({ contract_status: e.target.value })}
                options={Object.entries(contractLabels).map(([value, label]) => ({ value, label }))}
              />
            </label>
            {job.contract_url && <ExternalLink url={job.contract_url}>Abrir contrato</ExternalLink>}
          </Panel>
          <Panel title="Documentos">
            <Collection
              items={job.contracts}
              empty="Sin contratos"
              render={(contract) => (
                <Link
                  key={contract.id}
                  to="/app/contracts"
                  className="block text-sm text-amber-100"
                >
                  {contract.contract_number} · {contract.status}
                </Link>
              )}
            />
            <Collection
              items={job.quotes}
              empty="Sin presupuestos"
              render={(quote) => (
                <Link key={quote.id} to="/app/quotes" className="block text-sm text-amber-100">
                  {quote.quote_number} · {money(quote.total)}
                </Link>
              )}
            />
            <Collection
              items={job.invoices}
              empty="Sin facturas"
              render={(invoice) => (
                <Link key={invoice.id} to="/app/invoices" className="block text-sm text-amber-100">
                  {invoice.invoice_number} · {invoice.status}
                </Link>
              )}
            />
          </Panel>
        </div>
      </div>
      <Modal open={Boolean(edit)} title="Editar proyecto" onClose={closeEdit}>
        {discardEdit && (
          <div role="alert" className="mb-5 rounded-lg border border-amber-200/30 p-4">
            <p className="mb-3 text-sm text-stone-300">Los cambios sin guardar se perderán.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDiscardEdit(false)}>
                Seguir editando
              </Button>
              <Button
                onClick={() => {
                  setEdit(null);
                  setDiscardEdit(false);
                }}
              >
                Descartar cambios
              </Button>
            </div>
          </div>
        )}
        {edit && (
          <JobForm
            form={edit}
            setForm={setEdit}
            workflows={catalog.workflows}
            jobId={job.id}
            onSubmit={(event) => {
              event.preventDefault();
              update(edit);
            }}
            saving={saving}
            error={formError}
          />
        )}
      </Modal>
      <Modal
        open={blocker.state === "blocked"}
        title="Cambios sin guardar"
        onClose={() => blocker.reset?.()}
      >
        <p className="mb-4 text-sm text-stone-300">
          Tienes cambios sin guardar. Puedes volver para guardarlos o descartarlos y salir.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => blocker.reset()}>
            Volver al proyecto
          </Button>
          <Button onClick={() => blocker.proceed()}>Descartar y salir</Button>
        </div>
      </Modal>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-stone-100">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}
function Fact({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 py-3 text-sm">
      <span className="text-stone-400">{label}</span>
      <span className="break-words text-right text-stone-200">{value}</span>
    </div>
  );
}
function Collection({ items = [], empty, render }) {
  return (
    <div className="space-y-3">
      {items.length ? items.map(render) : <p className="text-sm text-stone-400">{empty}</p>}
    </div>
  );
}
function Action({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-stone-200 hover:border-amber-200/40 focus-visible:outline-2 focus-visible:outline-amber-200"
    >
      {children}
    </Link>
  );
}
function ExternalLink({ url, children }) {
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password)
      return <p className="text-sm text-stone-400">Enlace no disponible</p>;
  } catch {
    return null;
  }
  return (
    <a
      className="block break-words py-2 text-sm text-amber-100 hover:underline"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children} ↗
    </a>
  );
}
function money(value) {
  return value === null || value === undefined
    ? "Sin definir"
    : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value));
}
