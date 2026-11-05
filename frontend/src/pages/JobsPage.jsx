import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiError } from "../api/client";
import { jobsApi } from "../api/jobs";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Pagination } from "../components/ui/Pagination";
import { DemoBadge } from "../components/ui/DemoBadge";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { JobForm } from "../features/jobs/JobForm";
import {
  jobDefaults,
  normalizeJob,
  projectTypes,
  productionPhases,
} from "../features/jobs/jobFormUtils";
import { useCreateIntent } from "../hooks/useCreateIntent";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useToast } from "../features/notifications/ToastContext";

export function JobsPage() {
  const toast = useToast();
  const {
    items: jobs,
    meta,
    loading,
    error,
    refresh,
    filters,
    updateFilter,
    setPage,
  } = usePaginatedResource(jobsApi.page, { page: 1, per_page: 12, search: "", project_type: "" });
  const [catalog, setCatalog] = useState({ pipeline: {}, workflows: {} });
  const [optionsError, setOptionsError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(jobDefaults);
  async function loadOptions() {
    setOptionsError("");
    try {
      setCatalog(await jobsApi.workflows());
    } catch (err) {
      setOptionsError(getApiError(err));
    }
  }
  useEffect(() => {
    loadOptions();
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
      toast.success("Proyecto creado.");
      updateFilter("search", "");
      updateFilter("project_type", "");
      await refresh();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Creative workspace"
        title="Proyectos"
        description="De la primera idea a la entrega. Fotografía, audiovisual y proyectos personales, en un mismo espacio."
        action={<Button onClick={openCreate}>Nuevo proyecto</Button>}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_15rem]">
        <Input
          aria-label="Buscar proyectos"
          placeholder="Buscar por proyecto o cliente"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
        <Select
          aria-label="Filtrar por tipo"
          value={filters.project_type}
          onChange={(e) => updateFilter("project_type", e.target.value)}
          options={[{ value: "", label: "Todos los proyectos" }, ...projectTypes]}
        />
      </div>
      {error && <ErrorState message={error} onRetry={refresh} />}
      {optionsError && <ErrorState message={optionsError} onRetry={loadOptions} />}
      {loading && (
        <p role="status" className="text-sm text-stone-400">
          Cargando proyectos...
        </p>
      )}
      {!loading && !error && !jobs.length && (
        <EmptyState
          title="No hay proyectos en esta vista"
          description="Crea un proyecto personal o para un cliente, o ajusta los filtros."
          action={<Button onClick={openCreate}>Crear proyecto</Button>}
        />
      )}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/app/jobs/${job.id}`}
              className="group min-w-0 rounded-2xl border border-white/10 bg-[#13120f] p-5 transition hover:border-amber-200/40 focus-visible:outline-2 focus-visible:outline-amber-200"
            >
              <div className="mb-5 flex flex-wrap justify-between gap-2 text-xs text-stone-400">
                <span>
                  {projectTypes.find((type) => type.value === job.project_type)?.label ??
                    "Fotográfico"}
                </span>
                <span>
                  {productionPhases.find((phase) => phase.value === job.production_phase)?.label ??
                    "Cancelado"}
                </span>
              </div>
              <h2 className="break-words text-lg font-semibold text-stone-100 group-hover:text-amber-100">
                {job.title}
                <DemoBadge show={job.is_demo} />
              </h2>
              <p className="mt-2 text-sm text-stone-400">
                {job.client?.name || "Proyecto sin cliente"}
              </p>
              <p className="mt-5 text-xs text-stone-400">
                {catalog.pipeline[job.status] ?? job.status} ·{" "}
                {job.event_date || "Fecha por definir"}
              </p>
              <p className="mt-2 text-xs text-amber-100/70">
                {job.counts?.open_tasks ?? 0} tareas pendientes
              </p>
            </Link>
          ))}
        </div>
      )}
      <Pagination meta={meta} onPage={setPage} />
      <Modal
        open={open}
        title="Nuevo proyecto"
        onClose={() => {
          if (!saving) setOpen(false);
        }}
      >
        <JobForm
          form={form}
          setForm={setForm}
          workflows={catalog.workflows}
          onSubmit={submit}
          saving={saving}
          error={formError || optionsError}
        />
      </Modal>
    </>
  );
}
