import { useEffect, useState } from "react";
import { jobsApi } from "../../api/jobs";
import { getApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { Field } from "../../components/ui/Field";

const fields = [
  ["objectives", "Objetivos creativos"],
  ["references", "Referencias"],
  ["technical_requirements", "Necesidades técnicas"],
  ["scenes", "Escenas y momentos"],
  ["locations", "Localizaciones previstas"],
  ["risks", "Riesgos"],
  ["open_questions", "Aspectos pendientes"],
  ["notes", "Notas"],
];
const values = (briefing) =>
  Object.fromEntries(fields.map(([key]) => [key, briefing?.[key] ?? ""]));

export function ProjectBriefingEditor({ job, onSaved, onDirtyChange }) {
  const [form, setForm] = useState(() => values(job.briefing));
  const [baseline, setBaseline] = useState(() => JSON.stringify(values(job.briefing)));
  const [revision, setRevision] = useState(job.briefing_revision ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const dirty = JSON.stringify(form) !== baseline;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await jobsApi.briefing(job.id, form, revision);
      setBaseline(JSON.stringify(form));
      setRevision(result.briefing_revision);
      setConflict(false);
      setMessage("Briefing guardado.");
      onSaved(result);
    } catch (err) {
      setError(getApiError(err));
      setConflict(err.response?.status === 409);
    } finally {
      setSaving(false);
    }
  }

  async function reload() {
    setSaving(true);
    setError("");
    try {
      const result = await jobsApi.show(job.id);
      const next = values(result.briefing);
      setForm(next);
      setBaseline(JSON.stringify(next));
      setRevision(result.briefing_revision);
      setConfirmReload(false);
      setConflict(false);
      setMessage("Versión guardada cargada.");
      onSaved(result);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-stone-100">Briefing creativo</h2>
          <p className="mt-2 text-sm text-stone-400">
            Define la intención, las referencias y lo necesario para producir.
          </p>
        </div>
        <span className="text-xs text-stone-400">
          {dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}
        </span>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-red-400/30 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-200">
          {message}
        </p>
      )}
      <fieldset disabled={saving} className="grid min-w-0 gap-5 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <Field key={key} label={label}>
            <Textarea
              rows={key === "objectives" ? 5 : 4}
              maxLength={4000}
              value={form[key]}
              onChange={(e) => {
                setForm((current) => ({ ...current, [key]: e.target.value }));
                setMessage("");
              }}
            />
          </Field>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={saving || !dirty}>{saving ? "Guardando..." : "Guardar briefing"}</Button>
        {conflict && (
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => setConfirmReload(true)}
          >
            Cargar versión guardada
          </Button>
        )}
      </div>
      {confirmReload && (
        <div className="rounded-lg border border-amber-200/30 p-4">
          <p className="mb-3 text-sm text-stone-200">
            Al cargar la versión guardada se descartará tu borrador actual.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setConfirmReload(false)}>
              Conservar mi borrador
            </Button>
            <Button type="button" disabled={saving} onClick={reload}>
              Descartar y cargar
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
