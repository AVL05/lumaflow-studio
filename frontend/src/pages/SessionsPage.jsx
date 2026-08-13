import { useState } from "react";
import { bulkApi } from "../api/bulk";
import { exportsApi } from "../api/exports";
import { sessionsApi } from "../api/sessions";
import { getApiError } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { BulkActionBar } from "../components/ui/BulkActionBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Checkbox } from "../components/ui/Checkbox";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchBar } from "../components/ui/SearchBar";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { Textarea } from "../components/ui/Textarea";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { ChecklistPanel } from "../features/checklists/ChecklistPanel";
import { SessionTimeline } from "../features/timeline/SessionTimeline";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useCreateIntent } from "../hooks/useCreateIntent";
import { useSelection } from "../hooks/useSelection";
import { useToast } from "../features/notifications/ToastContext";
import { LocationSelector } from "../features/locations/LocationSelector";
import { LocationMapPreview } from "../features/locations/LocationMapPreview";
import { labelFor, sessionStatuses, sessionTypes, toneForStatus } from "../utils/catalogs";

const defaults = {
  job_id: "",
  name: "",
  location_id: "",
  date: "",
  time: "",
  session_type: "portrait",
  status: "planned",
  location_name: "",
  description: "",
  notes: "",
  client_name: "",
};

export function SessionsPage() {
  const toast = useToast();
  const resource = usePaginatedResource(sessionsApi.list, {
    per_page: 12,
    sort: "date",
    direction: "asc",
  });
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const selection = useSelection();
  const [bulkStatus, setBulkStatus] = useState("completed");

  async function runBulk(action, payload) {
    try {
      const { affected } = await bulkApi.run("sessions", action, selection.selected, payload);
      toast.success(`${affected} sesiones actualizadas.`);
      selection.clear();
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      ...defaults,
      job_id: new URLSearchParams(window.location.search).get("job_id") ?? "",
    });
    setFormError("");
    setFormOpen(true);
  }

  useCreateIntent(openCreate);

  function openEdit(session) {
    setEditing(session);
    setForm({
      ...defaults,
      ...session,
      location_id: session.location_id ? String(session.location_id) : "",
      time: session.time ?? "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (editing) {
        await sessionsApi.update(editing.id, normalizeSession(form));
        toast.success("Sesion actualizada.");
      } else {
        await sessionsApi.create(normalizeSession(form));
        toast.success("Sesion creada.");
      }
      setFormOpen(false);
      await resource.refresh();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    await sessionsApi.remove(deleting.id);
    toast.success("Sesion eliminada.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Planning"
        title="Sesiones"
        description="Gestiona sesiones con cliente, tipo, estado, localizacion, checklists, timeline y filtros reales."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => exportsApi.csv("sessions")}>
              Exportar CSV
            </Button>
            <Button onClick={openCreate}>Nueva sesion</Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_180px_180px_160px_140px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar por nombre, cliente o localizacion"
        />
        <Select
          value={resource.filters.status ?? ""}
          onChange={(e) => resource.updateFilter("status", e.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...sessionStatuses]}
        />
        <Select
          value={resource.filters.type ?? ""}
          onChange={(e) => resource.updateFilter("type", e.target.value)}
          options={[{ value: "", label: "Todos los tipos" }, ...sessionTypes]}
        />
        <Select
          value={resource.filters.sort ?? "date"}
          onChange={(e) => resource.updateFilter("sort", e.target.value)}
          options={[
            { value: "date", label: "Fecha" },
            { value: "name", label: "Nombre" },
            { value: "status", label: "Estado" },
          ]}
        />
        <Select
          value={resource.filters.direction ?? "asc"}
          onChange={(e) => resource.updateFilter("direction", e.target.value)}
          options={[
            { value: "asc", label: "Asc" },
            { value: "desc", label: "Desc" },
          ]}
        />
      </div>

      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <SessionSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No hay sesiones que coincidan con los filtros actuales."
          action={<Button onClick={openCreate}>Crear sesion</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((session) => (
              <Card key={session.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <Checkbox
                      checked={selection.isSelected(session.id)}
                      onChange={() => selection.toggle(session.id)}
                      aria-label={`Seleccionar ${session.name}`}
                      className="mt-1.5"
                    />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-stone-50">{session.name}</h2>
                      <p className="mt-1 text-sm text-stone-400">
                        {session.client_name || "Sin cliente"} ·{" "}
                        {session.location?.name || session.location_name || "Sin localizacion"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={toneForStatus(session.status)}>
                    {labelFor(sessionStatuses, session.status)}
                  </Badge>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm text-stone-400">
                  <span>{session.date}</span>
                  <span>{session.time || "Sin hora"}</span>
                  <span>{labelFor(sessionTypes, session.session_type)}</span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm text-stone-400">
                  {session.description || session.notes || "Sin descripcion."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setDetail(session)}>
                    Detalle
                  </Button>
                  <Button variant="secondary" onClick={() => openEdit(session)}>
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => setDeleting(session)}>
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <BulkActionBar count={selection.count} onClear={selection.clear}>
        <Select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          options={sessionStatuses}
        />
        <Button variant="secondary" onClick={() => runBulk("status", { value: bulkStatus })}>
          Cambiar estado
        </Button>
        <Button variant="secondary" onClick={() => exportsApi.csv("sessions", selection.selected)}>
          Exportar seleccion
        </Button>
        <Button variant="danger" onClick={() => runBulk("delete")}>
          Eliminar
        </Button>
      </BulkActionBar>

      <Modal
        open={formOpen}
        title={editing ? "Editar sesion" : "Nueva sesion"}
        onClose={() => setFormOpen(false)}
      >
        <SessionForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          error={formError}
          saving={saving}
        />
      </Modal>
      <Modal open={Boolean(detail)} title={detail?.name} onClose={() => setDetail(null)}>
        {detail ? <SessionDetail session={detail} /> : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar sesion"
        description="Esta accion eliminara la sesion de forma permanente."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function SessionForm({ form, setForm, onSubmit, error, saving }) {
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? (
        <div className="md:col-span-2">
          <ErrorState message={error} />
        </div>
      ) : null}
      <Field label="Nombre">
        <Input required value={form.name} onChange={(e) => setValue("name", e.target.value)} />
      </Field>
      <Field label="Cliente">
        <Input
          value={form.client_name ?? ""}
          onChange={(e) => setValue("client_name", e.target.value)}
        />
      </Field>
      <Field label="Fecha">
        <Input
          required
          type="date"
          value={form.date}
          onChange={(e) => setValue("date", e.target.value)}
        />
      </Field>
      <Field label="Hora">
        <Input
          type="time"
          value={form.time ?? ""}
          onChange={(e) => setValue("time", e.target.value)}
        />
      </Field>
      <Field label="Tipo">
        <Select
          value={form.session_type}
          onChange={(e) => setValue("session_type", e.target.value)}
          options={sessionTypes}
        />
      </Field>
      <Field label="Estado">
        <Select
          value={form.status}
          onChange={(e) => setValue("status", e.target.value)}
          options={sessionStatuses}
        />
      </Field>
      <Field label="Localizacion">
        <Input
          value={form.location_name ?? ""}
          onChange={(e) => setValue("location_name", e.target.value)}
        />
      </Field>
      <LocationSelector
        value={form.location_id}
        onChange={(value) => setValue("location_id", value)}
        onCreate={() => window.open("/app/locations", "_blank", "noopener,noreferrer")}
      />
      <div className="md:col-span-2">
        <Field label="Descripcion">
          <Textarea
            rows="3"
            value={form.description ?? ""}
            onChange={(e) => setValue("description", e.target.value)}
          />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Notas internas">
          <Textarea
            rows="3"
            value={form.notes ?? ""}
            onChange={(e) => setValue("notes", e.target.value)}
          />
        </Field>
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button disabled={saving}>{saving ? "Guardando..." : "Guardar sesion"}</Button>
      </div>
    </form>
  );
}

const detailTabs = [
  { value: "detail", label: "Detalle" },
  { value: "checklists", label: "Checklists" },
  { value: "timeline", label: "Timeline" },
];

function SessionDetail({ session }) {
  const [tab, setTab] = useState("detail");

  return (
    <div>
      <Tabs options={detailTabs} value={tab} onChange={setTab} className="mb-5" />
      {tab === "detail" ? <SessionSummary session={session} /> : null}
      {tab === "checklists" ? <ChecklistPanel sessionId={session.id} /> : null}
      {tab === "timeline" ? <SessionTimeline sessionId={session.id} /> : null}
    </div>
  );
}

function SessionSummary({ session }) {
  return (
    <div className="grid gap-4 text-sm text-stone-400 md:grid-cols-2">
      <p>
        <span className="text-stone-100">Cliente:</span> {session.client_name || "Sin cliente"}
      </p>
      <p>
        <span className="text-stone-100">Fecha:</span> {session.date} {session.time || ""}
      </p>
      <p>
        <span className="text-stone-100">Tipo:</span> {labelFor(sessionTypes, session.session_type)}
      </p>
      <p>
        <span className="text-stone-100">Estado:</span> {labelFor(sessionStatuses, session.status)}
      </p>
      <p className="md:col-span-2">
        <span className="text-stone-100">Localizacion:</span>{" "}
        {session.location?.name || session.location_name || "Sin localizacion"}
      </p>
      {session.location ? (
        <div className="md:col-span-2">
          <LocationMapPreview
            latitude={session.location.latitude}
            longitude={session.location.longitude}
            name={session.location.name}
          />
        </div>
      ) : null}
      <p className="md:col-span-2">
        <span className="text-stone-100">Descripcion:</span>{" "}
        {session.description || "Sin descripcion"}
      </p>
      <p className="md:col-span-2">
        <span className="text-stone-100">Notas:</span> {session.notes || "Sin notas"}
      </p>
    </div>
  );
}

function normalizeSession(form) {
  return {
    job_id: form.job_id ? Number(form.job_id) : null,
    name: form.name,
    location_id: form.location_id || null,
    date: form.date,
    time: form.time || null,
    location_name: form.location_name || null,
    session_type: form.session_type,
    status: form.status,
    description: form.description || null,
    notes: form.notes || null,
    client_name: form.client_name || null,
  };
}

function SessionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Skeleton key={item} className="h-56" />
      ))}
    </div>
  );
}
