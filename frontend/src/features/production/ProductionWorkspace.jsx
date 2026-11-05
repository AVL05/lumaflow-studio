import { useCallback, useEffect, useState } from "react";
import { productionApi } from "../../api/production";
import { checklistsApi } from "../../api/checklists";
import { getApiError } from "../../api/client";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Field } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { ErrorState } from "../../components/states/ErrorState";
import { DayForm, ShotForm } from "./ProductionForms";
import { dayForm, shotForm, shotPayload, shotStatuses } from "./productionFormUtils";

export function ProductionWorkspace({ job, onRefresh, onDirtyChange }) {
  const fetchShots = useCallback((params) => productionApi.shots(job.id, params), [job.id]);
  const fetchDays = useCallback((params) => productionApi.days(job.id, params), [job.id]);
  const shots = usePaginatedResource(fetchShots, { page: 1, session_id: "", status: "" });
  const days = usePaginatedResource(fetchDays, { page: 1, session_id: "" });
  const [mode, setMode] = useState(false);
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [discard, setDiscard] = useState(false);
  const dirty = Boolean(editor?.data && JSON.stringify(editor.data) !== editor.baseline);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function open(kind, record) {
    const data =
      kind === "day"
        ? dayForm(job, record)
        : kind === "notes"
          ? { notes: record.notes ?? "" }
          : kind === "shot"
            ? shotForm(record)
            : null;
    setEditor({ kind, record, data, baseline: JSON.stringify(data) });
    setError("");
    setConflict(false);
    setDiscard(false);
  }
  function close() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else setEditor(null);
  }
  const setForm = (updater) =>
    setEditor((current) => ({
      ...current,
      data: typeof updater === "function" ? updater(current.data) : updater,
    }));
  async function perform(action, closeEditor = false, refreshProject = false) {
    setBusy(true);
    setError("");
    setMessage("");
    setConflict(false);
    try {
      await action();
      if (closeEditor) setEditor(null);
      await Promise.all([shots.refresh(), days.refresh(), refreshProject ? onRefresh?.() : null]);
      setMessage("Cambios guardados.");
    } catch (err) {
      setError(getApiError(err));
      setConflict(err.response?.status === 409);
    } finally {
      setBusy(false);
    }
  }
  function save(event) {
    event.preventDefault();
    const { kind, record, data } = editor;
    if (kind === "day") {
      const payload = {
        ...data,
        time: data.time || null,
        end_time: data.end_time || null,
        location_id: data.location_id || null,
      };
      return perform(
        () =>
          record
            ? productionApi.updateDay(job.id, record.id, payload)
            : productionApi.createDay(job.id, payload),
        true,
        true,
      );
    }
    const payload = kind === "notes" ? data : shotPayload(data);
    return perform(
      () =>
        record
          ? productionApi.updateShot(job.id, record.id, { ...payload, revision: record.revision })
          : productionApi.createShot(job.id, payload),
      true,
    );
  }
  async function exportPdf(print) {
    const popup = print ? window.open("about:blank", "_blank") : null;
    if (popup) popup.opener = null;
    setBusy(true);
    setError("");
    try {
      if (print && !popup) throw new Error("Permite abrir la ventana del PDF para imprimir.");
      const blob = await productionApi.pdf(job.id, shots.filters.session_id);
      const url = URL.createObjectURL(blob);
      if (popup) popup.location.replace(url);
      else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `produccion-${job.id}.pdf`;
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage(print ? "PDF abierto. Usa el control de impresión del visor." : "PDF descargado.");
    } catch (err) {
      popup?.close();
      setError(err.message && !err.response ? err.message : getApiError(err));
    } finally {
      setBusy(false);
    }
  }

  const photography = job.project_type === "photography";
  const title = photography ? "Fotografías previstas" : "Shot list";
  const knownDays = [...(job.sessions ?? []), ...days.items].filter(
    (d, index, all) => all.findIndex((other) => other.id === d.id) === index,
  );
  return (
    <section aria-label="Producción" className="space-y-5 [&_button]:min-h-11 [&_select]:min-h-11">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-stone-400">
            Planifica {photography ? "fotografías" : "tomas"} y jornadas. Las escenas son
            opcionales. Horas locales del proyecto.
          </p>
        </div>
        <Button
          variant={mode ? "primary" : "secondary"}
          onClick={() => setMode(!mode)}
          aria-pressed={mode}
        >
          Modo rodaje
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => open("shot")} disabled={busy}>
          Añadir toma
        </Button>
        <Button variant="secondary" onClick={() => open("day")} disabled={busy}>
          Nueva jornada
        </Button>
        <Button variant="ghost" onClick={() => exportPdf(false)} disabled={busy}>
          Descargar PDF
        </Button>
        <Button variant="ghost" onClick={() => exportPdf(true)} disabled={busy}>
          Imprimir plan
        </Button>
      </div>
      <p className="text-xs text-stone-400">
        El PDF incluye todas las tomas de la jornada seleccionada, sin filtrar por estado. Sin
        selección, exporta el proyecto completo (hasta 500 tomas por documento).
      </p>
      {error && (
        <p role="alert" className="rounded-lg border border-red-400/40 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-200">
          {message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Filtrar por jornada">
          <Select
            disabled={busy}
            value={shots.filters.session_id}
            onChange={(e) => {
              shots.updateFilter("session_id", e.target.value);
              days.updateFilter("session_id", e.target.value);
            }}
            options={[
              { value: "", label: "Todas las jornadas" },
              ...knownDays.map((d) => ({ value: d.id, label: `${d.date} · ${d.name}` })),
            ]}
          />
        </Field>
        <Field label="Filtrar tomas por estado">
          <Select
            disabled={busy}
            value={shots.filters.status}
            onChange={(e) => shots.updateFilter("status", e.target.value)}
            options={[{ value: "", label: "Todos los estados" }, ...shotStatuses]}
          />
        </Field>
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Jornadas y preparación</h3>
        {days.error && <ErrorState message={days.error} onRetry={days.refresh} />}
        {days.loading && <p role="status">Cargando jornadas...</p>}
        {!days.loading && !days.error && !days.items.length && (
          <p className="text-sm text-stone-400">
            Crea una jornada para reunir horarios, participantes y tomas. Las sesiones existentes
            aparecen aquí.
          </p>
        )}
        {days.items
          .filter(
            (day) =>
              !mode ||
              !shots.filters.session_id ||
              String(day.id) === String(shots.filters.session_id),
          )
          .map((day) => (
            <article
              key={day.id}
              aria-label={`Jornada ${day.name}`}
              className="rounded-xl border border-white/10 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{day.name}</h4>
                  <p className="mt-1 text-sm text-stone-400">
                    {day.date} · {day.time?.slice(0, 5) || "Sin hora"} —{" "}
                    {day.end_time?.slice(0, 5) || "Por definir"}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => open("day", day)} disabled={busy}>
                  Editar jornada
                </Button>
              </div>
              <p className="mt-3 text-sm">
                {day.location?.name || day.location_name || "Localización por definir"}
              </p>
              {(day.location?.city || day.location?.country) && (
                <p className="text-sm text-stone-400">
                  {[day.location.city, day.location.country].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="mt-2 text-sm text-stone-400">
                {day.participants
                  ?.map((p) => `${p.name}${p.role ? ` · ${p.role}` : ""}`)
                  .join(", ") || "Sin participantes asignados"}
              </p>
              {day.notes && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm">{day.notes}</p>
              )}
              {day.incidents && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-amber-100">
                  Incidencias: {day.incidents}
                </p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {day.checklists?.map((list) => (
                  <fieldset key={list.id}>
                    <legend className="mb-2 text-sm font-semibold">{list.name}</legend>
                    {list.items?.map((item) => (
                      <label key={item.id} className="flex items-center gap-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          disabled={busy}
                          onChange={(e) =>
                            perform(() => checklistsApi.toggleItem(item.id, e.target.checked))
                          }
                        />
                        {item.title}
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
            </article>
          ))}
        <Pagination meta={days.meta} onPage={days.setPage} />
      </div>
      {shots.error && <ErrorState message={shots.error} onRetry={shots.refresh} />}
      {shots.loading && <p role="status">Cargando tomas...</p>}
      {!shots.loading && !shots.error && !shots.items.length && (
        <p className="rounded-xl border border-dashed border-white/20 p-6 text-stone-400">
          No hay tomas en esta vista. Añade una fotografía o un plano previsto.
        </p>
      )}
      <div className={mode ? "space-y-4" : "grid gap-4 lg:grid-cols-2"}>
        {shots.items.map((shot) => (
          <article
            key={shot.id}
            aria-label={`Toma ${shot.id}`}
            className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
          >
            <p className="text-xs uppercase tracking-wider text-amber-100">
              #{shot.id}
              {shot.scene ? ` · ${shot.scene}` : ""}
              {shot.scheduled_time ? ` · ${shot.scheduled_time.slice(0, 5)}` : ""}
            </p>
            <h3 className="mt-3 whitespace-pre-wrap break-words text-lg font-semibold">
              {shot.description}
            </h3>
            <p className="mt-2 text-sm text-stone-400">
              {[
                shot.shot_type,
                shot.camera_movement,
                shot.focal_length,
                shot.estimated_seconds ? `${shot.estimated_seconds} s` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-2 text-sm text-stone-400">
              {knownDays.find((d) => d.id === shot.session_id)?.name || "Sin jornada"} ·{" "}
              {shot.location?.name || "Sin localización"}
            </p>
            {shot.gear_items?.length > 0 && (
              <p className="mt-2 break-words text-sm">
                Equipo: {shot.gear_items.map((g) => g.name).join(", ")}
              </p>
            )}
            {shot.notes && (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-stone-300">
                {shot.notes}
              </p>
            )}
            <div className="mt-4">
              <Field label={`Estado de toma ${shot.id}`}>
                <Select
                  className="min-h-12"
                  disabled={busy}
                  value={shot.status}
                  options={shotStatuses}
                  onChange={(e) =>
                    perform(() =>
                      productionApi.updateShot(job.id, shot.id, {
                        status: e.target.value,
                        revision: shot.revision,
                      }),
                    )
                  }
                />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => open("notes", shot)} disabled={busy}>
                Observaciones
              </Button>
              {!mode && (
                <>
                  <Button variant="ghost" onClick={() => open("shot", shot)} disabled={busy}>
                    Editar toma
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => perform(() => productionApi.duplicate(job.id, shot.id))}
                    disabled={busy}
                  >
                    Duplicar
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Subir toma ${shot.id}`}
                    disabled={
                      busy ||
                      shots.loading ||
                      Boolean(shots.filters.session_id || shots.filters.status)
                    }
                    onClick={() => perform(() => productionApi.move(job.id, shot.id, "up"))}
                  >
                    ↑ Subir
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Bajar toma ${shot.id}`}
                    disabled={
                      busy ||
                      shots.loading ||
                      Boolean(shots.filters.session_id || shots.filters.status)
                    }
                    onClick={() => perform(() => productionApi.move(job.id, shot.id, "down"))}
                  >
                    ↓ Bajar
                  </Button>
                  <Button variant="ghost" onClick={() => open("delete", shot)} disabled={busy}>
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {(shots.filters.status || shots.filters.session_id) && (
        <p className="text-xs text-stone-400">
          Quita los filtros para reordenar la lista completa.
        </p>
      )}
      <Pagination meta={shots.meta} onPage={shots.setPage} />
      <Modal
        open={Boolean(editor)}
        title={
          editor?.kind === "day"
            ? "Jornada de producción"
            : editor?.kind === "delete"
              ? "Eliminar toma"
              : editor?.kind === "notes"
                ? "Observaciones de rodaje"
                : "Editar toma"
        }
        onClose={close}
      >
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-200">
            {error}
          </p>
        )}
        {conflict && (
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              setEditor(null);
              shots.refresh();
            }}
          >
            Descartar borrador y recargar lista
          </Button>
        )}
        {editor?.kind === "day" && (
          <DayForm job={job} form={editor.data} setForm={setForm} saving={busy} onSubmit={save} />
        )}
        {editor?.kind === "shot" && (
          <ShotForm job={job} form={editor.data} setForm={setForm} saving={busy} onSubmit={save} />
        )}
        {editor?.kind === "notes" && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Observaciones de la toma">
              <Textarea
                autoFocus
                rows={5}
                maxLength={4000}
                disabled={busy}
                value={editor.data.notes}
                onChange={(e) => setForm({ notes: e.target.value })}
              />
            </Field>
            <Button disabled={busy}>Guardar observaciones</Button>
          </form>
        )}
        {editor?.kind === "delete" && (
          <div className="space-y-4">
            <p>
              Se eliminará la toma #{editor.record.id} y su asignación. Esta acción no elimina
              archivos externos.
            </p>
            <Button
              disabled={busy}
              onClick={() => perform(() => productionApi.remove(job.id, editor.record.id), true)}
            >
              Confirmar eliminación
            </Button>
          </div>
        )}
        {discard && (
          <div className="mt-4 rounded-lg border border-amber-200/30 p-4">
            <p>Hay cambios sin guardar.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => setDiscard(false)}>
                Seguir editando
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditor(null);
                  setDiscard(false);
                }}
              >
                Descartar cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
