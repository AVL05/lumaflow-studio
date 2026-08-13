import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { clientsApi } from "../api/clients";
import { getApiError } from "../api/client";
import { jobsApi } from "../api/jobs";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { JobForm } from "../features/jobs/JobForm";
import { jobDefaults, normalizeJob } from "../features/jobs/jobFormUtils";
import { useCreateIntent } from "../hooks/useCreateIntent";
import { useToast } from "../features/notifications/ToastContext";

export function JobsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState({ pipeline: {}, workflows: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(jobDefaults);
  const columns = useMemo(() => Object.entries(catalog.pipeline), [catalog.pipeline]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [jobData, workflowData, clientData] = await Promise.all([
        jobsApi.list(),
        jobsApi.workflows(),
        clientsApi.list({ per_page: 100, sort: "name", direction: "asc" }),
      ]);
      setJobs(jobData);
      setCatalog(workflowData);
      setClients(clientData.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function openCreate() {
    setForm(jobDefaults);
    setFormError("");
    setOpen(true);
  }
  useCreateIntent(openCreate);
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await jobsApi.create(normalizeJob(form));
      setOpen(false);
      toast.success("Trabajo creado con su workflow.");
      await load();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Trabajos"
        description="Cada encargo, desde el primer contacto hasta la entrega y el cierre, en un único lugar."
        action={<Button onClick={openCreate}>Nuevo trabajo</Button>}
      />
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && jobs.length === 0 ? (
        <EmptyState
          title="Tu pipeline está listo"
          description="Crea tu primer trabajo y LumaFlow preparará las tareas adecuadas a su especialidad."
          action={<Button onClick={openCreate}>Crear primer trabajo</Button>}
        />
      ) : null}
      {loading ? <p className="text-sm text-stone-400">Cargando pipeline...</p> : null}
      {!loading && jobs.length ? (
        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-[1600px] grid-flow-col auto-cols-[17rem] gap-3">
            {columns.map(([status, label]) => {
              const items = jobs.filter((job) => job.status === status);
              return (
                <section
                  key={status}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-3"
                >
                  <div className="flex items-center justify-between px-1 pb-3">
                    <h2 className="text-sm font-semibold text-stone-200">{label}</h2>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-stone-500">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-xs text-stone-600">
                        Sin trabajos
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}
      <Modal open={open} title="Nuevo trabajo" onClose={() => setOpen(false)}>
        <JobForm
          form={form}
          setForm={setForm}
          clients={clients}
          workflows={catalog.workflows}
          onSubmit={submit}
          saving={saving}
          error={formError}
        />
      </Modal>
    </>
  );
}

function JobCard({ job }) {
  return (
    <Link
      to={`/app/jobs/${job.id}`}
      className="block rounded-xl border border-white/10 bg-[#15130f] p-4 transition hover:-translate-y-0.5 hover:border-amber-200/25 hover:bg-[#191610]"
    >
      <p className="font-semibold text-stone-100">{job.title}</p>
      <p className="mt-1 text-xs text-stone-500">{job.client?.name || "Cliente pendiente"}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-stone-500">
            {job.event_date
              ? new Date(`${job.event_date}T12:00:00`).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })
              : "Sin fecha"}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-amber-200/70">
            {job.specialty}
          </p>
        </div>
        {job.counts?.open_tasks ? (
          <span className="text-xs text-stone-400">{job.counts.open_tasks} tareas</span>
        ) : null}
      </div>
    </Link>
  );
}
