import { useEffect, useMemo, useState } from "react";
import { clientsApi } from "../api/clients";
import { getApiError } from "../api/client";
import { deliveriesApi } from "../api/deliveries";
import { remindersApi } from "../api/reminders";
import { sessionsApi } from "../api/sessions";
import { tasksApi } from "../api/tasks";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { SearchBar } from "../components/ui/SearchBar";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
import { useToast } from "../features/notifications/ToastContext";
import { ReminderCard } from "../features/reminders/ReminderCard";
import { ReminderForm } from "../features/reminders/ReminderForm";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { reminderStatuses, reminderTypes } from "../utils/catalogs";

const defaults = {
  message: "",
  remind_date: "",
  remind_time: "",
  type: "custom",
  status: "pending",
  remindable_id: "",
};

export function RemindersPage() {
  const toast = useToast();
  const resource = usePaginatedResource(remindersApi.list, { per_page: 20 });

  const [catalogs, setCatalogs] = useState({
    sessions: [],
    clients: [],
    deliveries: [],
    tasks: [],
  });
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([sessionsApi.list(), clientsApi.list(), deliveriesApi.list(), tasksApi.list()])
      .then(([sessions, clients, deliveries, tasks]) =>
        setCatalogs({ sessions, clients, deliveries, tasks }),
      )
      .catch(() => toast.error("No se pudieron cargar los elementos asociables."));
  }, [toast]);

  const subjects = useMemo(
    () => ({
      session: catalogs.sessions.map((item) => ({ value: String(item.id), label: item.name })),
      client: catalogs.clients.map((item) => ({ value: String(item.id), label: item.name })),
      delivery: catalogs.deliveries.map((item) => ({ value: String(item.id), label: item.title })),
      task: catalogs.tasks.map((item) => ({ value: String(item.id), label: item.title })),
    }),
    [catalogs],
  );

  function openCreate() {
    setEditing(null);
    setForm(defaults);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(reminder) {
    setEditing(reminder);
    setForm({
      ...defaults,
      ...reminder,
      remind_time: reminder.remind_time ?? "",
      remindable_id: reminder.remindable_id ? String(reminder.remindable_id) : "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = normalizeReminder(form);

      if (editing) {
        await remindersApi.update(editing.id, payload);
        toast.success("Recordatorio actualizado.");
      } else {
        await remindersApi.create(payload);
        toast.success("Recordatorio creado.");
      }

      setFormOpen(false);
      await resource.refresh();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function complete(reminder) {
    try {
      await remindersApi.update(reminder.id, { ...normalizeReminder(reminder), status: "done" });
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function confirmDelete() {
    await remindersApi.remove(deleting.id);
    toast.success("Recordatorio eliminado.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Workflow"
        title="Recordatorios"
        description="Avisos asociados a sesiones, clientes, entregas y tareas, visibles tambien en el calendario."
        action={<Button onClick={openCreate}>Nuevo recordatorio</Button>}
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar por mensaje"
        />
        <Select
          value={resource.filters.status ?? ""}
          onChange={(e) => resource.updateFilter("status", e.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...reminderStatuses]}
        />
        <Select
          value={resource.filters.type ?? ""}
          onChange={(e) => resource.updateFilter("type", e.target.value)}
          options={[{ value: "", label: "Todos los tipos" }, ...reminderTypes]}
        />
      </div>

      {resource.error ? <ErrorState message={resource.error} /> : null}

      {resource.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin recordatorios"
          description="Crea avisos para no perder fechas clave de sesiones y entregas."
          action={<Button onClick={openCreate}>Crear recordatorio</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={openEdit}
                onDelete={setDeleting}
                onComplete={complete}
              />
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Editar recordatorio" : "Nuevo recordatorio"}
        onClose={() => setFormOpen(false)}
      >
        <ReminderForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          error={formError}
          saving={saving}
          subjects={subjects}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar recordatorio"
        description="Esta accion elimina el recordatorio de forma permanente."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function normalizeReminder(form) {
  return {
    message: form.message,
    remind_date: form.remind_date,
    remind_time: form.remind_time || null,
    type: form.type,
    status: form.status,
    remindable_type: form.type === "custom" ? null : form.type,
    remindable_id: form.type === "custom" ? null : form.remindable_id || null,
  };
}
