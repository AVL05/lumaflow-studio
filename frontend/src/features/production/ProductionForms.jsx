import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { ProjectResourcePicker } from "../jobs/ProjectResourcePicker";

import { shotStatuses } from "./productionFormUtils";

export function ShotForm({ job, form, setForm, onSubmit, saving }) {
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset disabled={saving} className="min-w-0 space-y-4">
        <Field label="Descripción de la toma">
          <Textarea
            required
            maxLength={2000}
            rows={3}
            value={form.description}
            onChange={update("description")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["scene", "Escena o grupo (opcional)"],
            ["shot_type", "Tipo de plano o fotografía"],
            ["camera_movement", "Movimiento de cámara"],
            ["focal_length", "Óptica o focal"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <Input maxLength={120} value={form[key]} onChange={update(key)} />
            </Field>
          ))}
          <Field label="Duración estimada (segundos)">
            <Input
              type="number"
              min={1}
              max={86400}
              value={form.estimated_seconds}
              onChange={update("estimated_seconds")}
            />
          </Field>
          <Field label="Hora prevista">
            <Input type="time" value={form.scheduled_time} onChange={update("scheduled_time")} />
          </Field>
          <Field label="Jornada asignada">
            <Select
              value={form.session_id}
              onChange={update("session_id")}
              options={[
                { value: "", label: "Sin asignar" },
                ...(job.sessions ?? []).map((day) => ({
                  value: day.id,
                  label: `${day.date} · ${day.name}`,
                })),
              ]}
            />
          </Field>
          <Field label="Estado de la toma">
            <Select value={form.status} onChange={update("status")} options={shotStatuses} />
          </Field>
        </div>
        <ProjectResourcePicker
          jobId={job.id}
          resource="locations"
          label="Localización de la toma"
          single
          selected={form.location_id ? [Number(form.location_id)] : []}
          onChange={(ids) => setForm((f) => ({ ...f, location_id: ids[0] ?? "" }))}
        />
        <ProjectResourcePicker
          jobId={job.id}
          resource="gear"
          label="Equipo de la toma"
          selected={form.gear_item_ids}
          onChange={(ids) => setForm((f) => ({ ...f, gear_item_ids: ids }))}
        />
        <Field label="Notas de la toma">
          <Textarea maxLength={4000} rows={3} value={form.notes} onChange={update("notes")} />
        </Field>
      </fieldset>
      <Button disabled={saving}>{saving ? "Guardando..." : "Guardar toma"}</Button>
    </form>
  );
}

export function DayForm({ job, form, setForm, onSubmit, saving }) {
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const people = [...(job.participants ?? []), ...form.participants].filter(
    (p, index, all) =>
      all.findIndex((other) => other.name === p.name && other.role === p.role) === index,
  );
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset disabled={saving} className="min-w-0 space-y-4">
        <Field label="Nombre de la jornada">
          <Input required maxLength={160} value={form.name} onChange={update("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha de producción">
            <Input required type="date" value={form.date} onChange={update("date")} />
          </Field>
          <Field label="Hora de inicio">
            <Input type="time" value={form.time} onChange={update("time")} />
          </Field>
          <Field label="Hora de fin">
            <Input type="time" value={form.end_time} onChange={update("end_time")} />
          </Field>
        </div>
        <ProjectResourcePicker
          jobId={job.id}
          resource="locations"
          label="Localización de la jornada"
          single
          selected={form.location_id ? [Number(form.location_id)] : []}
          onChange={(ids) => setForm((f) => ({ ...f, location_id: ids[0] ?? "" }))}
        />
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">Participantes del proyecto</legend>
          {!people.length && (
            <p className="text-sm text-stone-400">
              Añade participantes en la organización del proyecto.
            </p>
          )}
          {people.map((person, index) => (
            <label key={index} className="flex items-center gap-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.participants.some(
                  (p) => p.name === person.name && p.role === person.role,
                )}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    participants: e.target.checked
                      ? [...f.participants, person]
                      : f.participants.filter(
                          (p) => p.name !== person.name || p.role !== person.role,
                        ),
                  }))
                }
              />
              {person.name}
              {person.role ? ` · ${person.role}` : ""}
            </label>
          ))}
        </fieldset>
        <Field label="Notas de producción">
          <Textarea rows={3} maxLength={3000} value={form.notes} onChange={update("notes")} />
        </Field>
        <Field label="Incidencias de la jornada">
          <Textarea
            rows={3}
            maxLength={3000}
            value={form.incidents}
            onChange={update("incidents")}
          />
        </Field>
      </fieldset>
      <Button disabled={saving}>{saving ? "Guardando..." : "Guardar jornada"}</Button>
    </form>
  );
}
