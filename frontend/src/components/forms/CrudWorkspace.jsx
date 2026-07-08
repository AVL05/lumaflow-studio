import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiError } from "../../api/client";
import { Button } from "../ui/Button";
import { Field, inputClass } from "../ui/Field";
import { Panel } from "../ui/Panel";
import { EmptyState } from "../states/EmptyState";
import { ErrorState } from "../states/ErrorState";

export function CrudWorkspace({
  api,
  title,
  fields,
  empty,
  renderCard,
  defaults,
}) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sortedItems = useMemo(() => items, [items]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setItems(await api.list());
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function setValue(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function edit(item) {
    setEditing(item.id);
    setForm(
      fields.reduce(
        (next, field) => ({
          ...next,
          [field.name]: item[field.name] ?? defaults[field.name] ?? "",
        }),
        {},
      ),
    );
  }

  function reset() {
    setEditing(null);
    setForm(defaults);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await api.update(editing, form);
      } else {
        await api.create(form);
      }
      reset();
      await refresh();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setError("");

    try {
      await api.remove(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(getApiError(err));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Panel className="p-5">
        <h2 className="text-lg font-semibold">
          {editing ? `Editar ${title}` : `Nuevo ${title}`}
        </h2>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          {fields.map((field) => (
            <Field key={field.name} label={field.label}>
              {field.type === "select" ? (
                <select
                  className={inputClass}
                  value={form[field.name]}
                  onChange={(e) => setValue(field.name, e.target.value)}
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  className={inputClass}
                  rows="4"
                  value={form[field.name] ?? ""}
                  onChange={(e) => setValue(field.name, e.target.value)}
                />
              ) : field.type === "checkbox" ? (
                <input
                  className="h-5 w-5 accent-amber-200"
                  type="checkbox"
                  checked={Boolean(form[field.name])}
                  onChange={(e) => setValue(field.name, e.target.checked)}
                />
              ) : (
                <input
                  className={inputClass}
                  type={field.type ?? "text"}
                  value={form[field.name] ?? ""}
                  onChange={(e) =>
                    setValue(
                      field.name,
                      field.type === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                />
              )}
            </Field>
          ))}
          {error ? <ErrorState message={error} /> : null}
          <div className="flex gap-2">
            <Button disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            {editing ? (
              <Button type="button" variant="secondary" onClick={reset}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </Panel>

      <div>
        {loading ? (
          <Panel className="p-6 text-sm text-stone-400">Cargando...</Panel>
        ) : sortedItems.length === 0 ? (
          <EmptyState title={empty.title} description={empty.description} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedItems.map((item) => (
              <Panel key={item.id} className="p-5">
                {renderCard(item)}
                <div className="mt-5 flex gap-2">
                  <Button variant="secondary" onClick={() => edit(item)}>
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => remove(item.id)}>
                    Eliminar
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
