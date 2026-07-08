import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calendarApi } from "../api/calendar";
import { clientsApi } from "../api/clients";
import { getApiError } from "../api/client";
import { remindersApi } from "../api/reminders";
import { sessionsApi } from "../api/sessions";
import { tasksApi } from "../api/tasks";
import { deliveriesApi } from "../api/deliveries";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { ErrorState } from "../components/states/ErrorState";
import { CalendarAgenda } from "../features/calendar/CalendarAgenda";
import { CalendarDay } from "../features/calendar/CalendarDay";
import { CalendarList } from "../features/calendar/CalendarList";
import { CalendarMonth } from "../features/calendar/CalendarMonth";
import { CalendarSidebar } from "../features/calendar/CalendarSidebar";
import { CalendarWeek } from "../features/calendar/CalendarWeek";
import {
  addDays,
  addMonths,
  dayLabel,
  monthLabel,
  rangeForView,
  todayIso,
} from "../features/calendar/calendarUtils";
import { useToast } from "../features/notifications/ToastContext";
import { ReminderForm } from "../features/reminders/ReminderForm";
import { TaskForm } from "../features/tasks/TaskForm";
import { usePersistedState } from "../hooks/usePersistedState";
import { calendarSources } from "../utils/catalogs";

const views = [
  { value: "month", label: "Mes" },
  { value: "week", label: "Semana" },
  { value: "day", label: "Dia" },
  { value: "agenda", label: "Agenda" },
  { value: "list", label: "Lista" },
];

const taskDefaults = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  due_date: "",
  due_time: "",
  session_id: "",
  client_id: "",
};

const reminderDefaults = {
  message: "",
  remind_date: "",
  remind_time: "",
  type: "custom",
  status: "pending",
  remindable_id: "",
};

export function CalendarPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [prefs, setPrefs] = usePersistedState("calendar", {
    view: "month",
    sources: calendarSources.map((source) => source.value),
  });
  const [cursor, setCursor] = useState(todayIso());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [taskForm, setTaskForm] = useState(taskDefaults);
  const [reminderForm, setReminderForm] = useState(reminderDefaults);
  const [taskOpen, setTaskOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [tasks, setTasks] = useState([]);

  const range = useMemo(() => rangeForView(prefs.view, cursor), [prefs.view, cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setEvents(await calendarApi.events({ ...range, sources: prefs.sources }));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [range, prefs.sources]);

  useEffect(() => {
    load();
  }, [load]);

  // Catalogos para los formularios rapidos; se cargan una sola vez.
  useEffect(() => {
    Promise.all([sessionsApi.list(), clientsApi.list(), deliveriesApi.list(), tasksApi.list()])
      .then(([sessionList, clientList, deliveryList, taskList]) => {
        setSessions(sessionList);
        setClients(clientList);
        setDeliveries(deliveryList);
        setTasks(taskList);
      })
      .catch(() => toast.error("No se pudieron cargar los catalogos del calendario."));
  }, [toast]);

  const counts = useMemo(
    () =>
      events.reduce((totals, event) => {
        totals[event.source] = (totals[event.source] ?? 0) + 1;

        return totals;
      }, {}),
    [events],
  );

  const subjects = useMemo(
    () => ({
      session: sessions.map((item) => ({ value: String(item.id), label: item.name })),
      client: clients.map((item) => ({ value: String(item.id), label: item.name })),
      delivery: deliveries.map((item) => ({ value: String(item.id), label: item.title })),
      task: tasks.map((item) => ({ value: String(item.id), label: item.title })),
    }),
    [sessions, clients, deliveries, tasks],
  );

  function toggleSource(source) {
    setPrefs((current) => ({
      ...current,
      sources: current.sources.includes(source)
        ? current.sources.filter((item) => item !== source)
        : [...current.sources, source],
    }));
  }

  /** Actualiza de forma optimista y revierte si el backend rechaza el movimiento. */
  async function handleMove({ source, sourceId, date, time }) {
    const snapshot = events;
    setEvents((current) =>
      current.map((event) =>
        event.source === source && event.source_id === sourceId
          ? { ...event, date, time: time ?? event.time }
          : event,
      ),
    );

    try {
      await calendarApi.move({ source, sourceId, date, time });
      toast.success("Evento reprogramado.");
      await load();
    } catch (err) {
      setEvents(snapshot);
      toast.error(getApiError(err, "No se pudo mover el evento."));
    }
  }

  function openTask(date) {
    setTaskForm({ ...taskDefaults, due_date: date ?? cursor });
    setFormError("");
    setTaskOpen(true);
  }

  function openReminder(date) {
    setReminderForm({ ...reminderDefaults, remind_date: date ?? cursor });
    setFormError("");
    setReminderOpen(true);
  }

  async function submitTask(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      await tasksApi.create({
        ...taskForm,
        description: taskForm.description || null,
        due_date: taskForm.due_date || null,
        due_time: taskForm.due_time || null,
        session_id: taskForm.session_id || null,
        client_id: taskForm.client_id || null,
      });
      toast.success("Tarea creada.");
      setTaskOpen(false);
      await load();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function submitReminder(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      await remindersApi.create({
        message: reminderForm.message,
        remind_date: reminderForm.remind_date,
        remind_time: reminderForm.remind_time || null,
        type: reminderForm.type,
        status: reminderForm.status,
        remindable_type: reminderForm.type === "custom" ? null : reminderForm.type,
        remindable_id: reminderForm.remindable_id || null,
      });
      toast.success("Recordatorio creado.");
      setReminderOpen(false);
      await load();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function shift(direction) {
    if (prefs.view === "month") return setCursor((current) => addMonths(current, direction));
    if (prefs.view === "week") return setCursor((current) => addDays(current, direction * 7));

    return setCursor((current) => addDays(current, direction));
  }

  const heading = prefs.view === "day" ? dayLabel(cursor) : monthLabel(cursor);

  return (
    <>
      <PageHeader
        eyebrow="Workflow"
        title="Calendario"
        description="Sesiones, entregas, tareas y recordatorios en una sola linea temporal. Arrastra para reprogramar."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setCursor(todayIso())}>
              Hoy
            </Button>
            <Button onClick={() => openTask(cursor)}>Nueva tarea</Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" aria-label="Anterior" onClick={() => shift(-1)}>
            ‹
          </Button>
          <span className="min-w-48 text-center text-sm font-medium text-stone-200">{heading}</span>
          <Button variant="secondary" aria-label="Siguiente" onClick={() => shift(1)}>
            ›
          </Button>
        </div>
        <Tabs
          options={views}
          value={prefs.view}
          onChange={(view) => setPrefs((current) => ({ ...current, view }))}
        />
      </div>

      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div>
          {loading ? (
            <Skeleton className="h-[560px]" />
          ) : prefs.view === "month" ? (
            <CalendarMonth
              cursor={cursor}
              events={events}
              onMove={handleMove}
              onSelect={(event) => navigate(event.url)}
              onCreate={openTask}
            />
          ) : prefs.view === "week" ? (
            <CalendarWeek
              cursor={cursor}
              events={events}
              onMove={handleMove}
              onSelect={(event) => navigate(event.url)}
              onCreate={openTask}
            />
          ) : prefs.view === "day" ? (
            <CalendarDay
              cursor={cursor}
              events={events}
              onMove={handleMove}
              onSelect={(event) => navigate(event.url)}
            />
          ) : prefs.view === "agenda" ? (
            <CalendarAgenda events={events} onSelect={(event) => navigate(event.url)} />
          ) : (
            <CalendarList events={events} onSelect={(event) => navigate(event.url)} />
          )}
        </div>

        <div className="space-y-4">
          <CalendarSidebar
            sources={prefs.sources}
            onToggleSource={toggleSource}
            counts={counts}
            onCreateTask={() => openTask(cursor)}
            onCreateReminder={() => openReminder(cursor)}
          />
          <Panel className="p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Rango consultado</p>
            <p className="mt-2 text-sm tabular-nums text-stone-300">
              {range.from} → {range.to}
            </p>
            <p className="mt-3 text-xs text-stone-600">{events.length} eventos cargados</p>
          </Panel>
        </div>
      </div>

      <Modal open={taskOpen} title="Nueva tarea" onClose={() => setTaskOpen(false)}>
        <TaskForm
          form={taskForm}
          setForm={setTaskForm}
          onSubmit={submitTask}
          error={formError}
          saving={saving}
          sessions={sessions}
          clients={clients}
        />
      </Modal>

      <Modal open={reminderOpen} title="Nuevo recordatorio" onClose={() => setReminderOpen(false)}>
        <ReminderForm
          form={reminderForm}
          setForm={setReminderForm}
          onSubmit={submitReminder}
          error={formError}
          saving={saving}
          subjects={subjects}
        />
      </Modal>
    </>
  );
}
