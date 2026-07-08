import { useCallback, useEffect, useState } from "react";
import { bulkApi } from "../api/bulk";
import { clientsApi } from "../api/clients";
import { getApiError } from "../api/client";
import { exportsApi } from "../api/exports";
import { sessionsApi } from "../api/sessions";
import { tasksApi } from "../api/tasks";
import { BulkActionBar } from "../components/ui/BulkActionBar";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
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
import { TaskCard } from "../features/tasks/TaskCard";
import { TaskForm } from "../features/tasks/TaskForm";
import { TaskSummary } from "../features/tasks/TaskSummary";
import { useHotkey } from "../hooks/useHotkey";
import { usePaginatedResource } from "../hooks/usePaginatedResource";
import { useSelection } from "../hooks/useSelection";
import { taskPriorities, taskStatuses } from "../utils/catalogs";

const defaults = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  due_date: "",
  due_time: "",
  session_id: "",
  client_id: "",
};

export function TasksPage() {
  const toast = useToast();
  const resource = usePaginatedResource(tasksApi.list, {
    per_page: 15,
    sort: "due_date",
    direction: "asc",
  });
  const selection = useSelection();

  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [bulkStatus, setBulkStatus] = useState("completed");

  useHotkey("shift+n", () => openCreate());

  useEffect(() => {
    Promise.all([sessionsApi.list(), clientsApi.list()])
      .then(([sessionList, clientList]) => {
        setSessions(sessionList);
        setClients(clientList);
      })
      .catch(() => toast.error("No se pudieron cargar sesiones y clientes."));
  }, [toast]);

  // Endpoint dedicado: antes se cargaba el dashboard entero (incluida la sonda
  // de Ollama) solo para leer estos cuatro totales.
  const refreshSummary = useCallback(() => {
    tasksApi
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(refreshSummary, [refreshSummary]);

  const refresh = resource.refresh;

  const reload = useCallback(async () => {
    await refresh();
    refreshSummary();
  }, [refresh, refreshSummary]);

  function openCreate() {
    setEditing(null);
    setForm(defaults);
    setFormError("");
    setFormOpen(true);
  }

  // Estables para que TaskCard (memoizada) no se re-renderice en cada seleccion.
  const openEdit = useCallback((task) => {
    setEditing(task);
    setForm({
      ...defaults,
      ...task,
      due_date: task.due_date ?? "",
      due_time: task.due_time ?? "",
      session_id: task.session_id ? String(task.session_id) : "",
      client_id: task.client_id ? String(task.client_id) : "",
    });
    setFormError("");
    setFormOpen(true);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = normalizeTask(form);

      if (editing) {
        await tasksApi.update(editing.id, payload);
        toast.success("Tarea actualizada.");
      } else {
        await tasksApi.create(payload);
        toast.success("Tarea creada.");
      }

      setFormOpen(false);
      await reload();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const toggleStatus = useCallback(
    async (task) => {
      try {
        await tasksApi.update(task.id, {
          ...normalizeTask(task),
          status: task.status === "completed" ? "todo" : "completed",
        });
        await reload();
      } catch (err) {
        toast.error(getApiError(err));
      }
    },
    [reload, toast],
  );

  async function confirmDelete() {
    await tasksApi.remove(deleting.id);
    toast.success("Tarea eliminada.");
    setDeleting(null);
    await reload();
  }

  async function runBulk(action, payload) {
    try {
      const { affected } = await bulkApi.run("tasks", action, selection.selected, payload);
      toast.success(`${affected} tareas actualizadas.`);
      selection.clear();
      await reload();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  const ids = resource.items.map((task) => task.id);

  return (
    <>
      <PageHeader
        eyebrow="Workflow"
        title="Tareas"
        description="Organiza el trabajo por prioridad, estado y fecha limite, conectado a sesiones y clientes."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => exportsApi.csv("tasks")}>
              Exportar CSV
            </Button>
            <Button onClick={openCreate}>Nueva tarea</Button>
          </div>
        }
      />

      <TaskSummary summary={summary} />

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_170px_170px_160px_140px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar por titulo o descripcion"
        />
        <Select
          value={resource.filters.status ?? ""}
          onChange={(e) => resource.updateFilter("status", e.target.value)}
          options={[{ value: "", label: "Todos los estados" }, ...taskStatuses]}
        />
        <Select
          value={resource.filters.priority ?? ""}
          onChange={(e) => resource.updateFilter("priority", e.target.value)}
          options={[{ value: "", label: "Toda prioridad" }, ...taskPriorities]}
        />
        <Select
          value={resource.filters.sort ?? "due_date"}
          onChange={(e) => resource.updateFilter("sort", e.target.value)}
          options={[
            { value: "due_date", label: "Fecha" },
            { value: "priority", label: "Prioridad" },
            { value: "status", label: "Estado" },
            { value: "title", label: "Titulo" },
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
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-52" />
          ))}
        </div>
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin tareas"
          description="Crea la primera tarea para organizar la preparacion, edicion y entrega."
          action={<Button onClick={openCreate}>Crear tarea</Button>}
        />
      ) : (
        <>
          <div className="mb-3">
            <Checkbox
              checked={selection.count === ids.length && ids.length > 0}
              onChange={() => selection.toggleAll(ids)}
              label="Seleccionar todo"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {resource.items.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selection.isSelected(task.id)}
                onSelect={selection.toggle}
                onToggle={toggleStatus}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <BulkActionBar count={selection.count} onClear={selection.clear}>
        <Select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          options={taskStatuses}
        />
        <Button variant="secondary" onClick={() => runBulk("status", { value: bulkStatus })}>
          Cambiar estado
        </Button>
        <Button variant="secondary" onClick={() => exportsApi.csv("tasks", selection.selected)}>
          Exportar seleccion
        </Button>
        <Button variant="danger" onClick={() => runBulk("delete")}>
          Eliminar
        </Button>
      </BulkActionBar>

      <Modal
        open={formOpen}
        title={editing ? "Editar tarea" : "Nueva tarea"}
        onClose={() => setFormOpen(false)}
      >
        <TaskForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          error={formError}
          saving={saving}
          sessions={sessions}
          clients={clients}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar tarea"
        description="Esta accion elimina la tarea de forma permanente."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function normalizeTask(form) {
  return {
    title: form.title,
    description: form.description || null,
    priority: form.priority,
    status: form.status,
    due_date: form.due_date || null,
    due_time: form.due_time || null,
    session_id: form.session_id || null,
    client_id: form.client_id || null,
  };
}
