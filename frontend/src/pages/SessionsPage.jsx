import { useState } from "react";
import { sessionsApi } from "../api/sessions";
import { getApiError } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchBar } from "../components/ui/SearchBar";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { Textarea } from "../components/ui/Textarea";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useToast } from "../features/notifications/ToastContext";
import {
  labelFor,
  sessionStatuses,
  sessionTypes,
  toneForStatus,
} from "../utils/catalogs";

const defaults = {
  name: "",
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

  function openCreate() {
    setEditing(null);
    setForm(defaults);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(session) {
    setEditing(session);
    setForm({ ...defaults, ...session, time: session.time ?? "" });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (editing) {
        await sessionsApi.update(editing.id, form);
        toast.success("Sesion actualizada.");
      } else {
        await sessionsApi.create(form);
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
        description="Gestiona sesiones con cliente, tipo, estado, localizacion, detalle operativo y filtros reales."
        action={<Button onClick={openCreate}>Nueva sesion</Button>}
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
          options={[
            { value: "", label: "Todos los estados" },
            ...sessionStatuses,
          ]}
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
                  <div>
                    <h2 className="font-semibold text-stone-50">
                      {session.name}
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      {session.client_name || "Sin cliente"} ·{" "}
                      {session.location_name || "Sin localizacion"}
                    </p>
                  </div>
                  <Badge variant={toneForStatus(session.status)}>
                    {labelFor(sessionStatuses, session.status)}
                  </Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-stone-400">
                  <span>{session.date}</span>
                  <span>{session.time || "Sin hora"}</span>
                  <span>{labelFor(sessionTypes, session.session_type)}</span>
                  <span>{session.photos_count ?? 0} fotos</span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm text-stone-500">
                  {session.description || session.notes || "Sin descripcion."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setDetail(session)}
                  >
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
      <Modal
        open={Boolean(detail)}
        title={detail?.name}
        onClose={() => setDetail(null)}
      >
        {detail ? <SessionDetail session={detail} /> : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar sesion"
        description="Esta accion eliminara la sesion. Las fotos asociadas quedaran sin sesion."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function SessionForm({ form, setForm, onSubmit, error, saving }) {
  const setValue = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? (
        <div className="md:col-span-2">
          <ErrorState message={error} />
        </div>
      ) : null}
      <Field label="Nombre">
        <Input
          required
          value={form.name}
          onChange={(e) => setValue("name", e.target.value)}
        />
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
      <div />
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
        <Button disabled={saving}>
          {saving ? "Guardando..." : "Guardar sesion"}
        </Button>
      </div>
    </form>
  );
}

function SessionDetail({ session }) {
  return (
    <div className="grid gap-4 text-sm text-stone-400 md:grid-cols-2">
      <p>
        <span className="text-stone-100">Cliente:</span>{" "}
        {session.client_name || "Sin cliente"}
      </p>
      <p>
        <span className="text-stone-100">Fecha:</span> {session.date}{" "}
        {session.time || ""}
      </p>
      <p>
        <span className="text-stone-100">Tipo:</span>{" "}
        {labelFor(sessionTypes, session.session_type)}
      </p>
      <p>
        <span className="text-stone-100">Estado:</span>{" "}
        {labelFor(sessionStatuses, session.status)}
      </p>
      <p className="md:col-span-2">
        <span className="text-stone-100">Localizacion:</span>{" "}
        {session.location_name || "Sin localizacion"}
      </p>
      <p className="md:col-span-2">
        <span className="text-stone-100">Descripcion:</span>{" "}
        {session.description || "Sin descripcion"}
      </p>
      <p className="md:col-span-2">
        <span className="text-stone-100">Notas:</span>{" "}
        {session.notes || "Sin notas"}
      </p>
    </div>
  );
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
