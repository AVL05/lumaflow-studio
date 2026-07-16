import { useEffect, useState } from "react";
import { gearApi } from "../api/gear";
import { presetsApi } from "../api/presets";
import { getApiError } from "../api/client";
import { EmptyState } from "../components/states/EmptyState";
import { ErrorState } from "../components/states/ErrorState";
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
import { useToast } from "../features/notifications/ToastContext";
import { usePaginatedResource } from "../hooks/usePaginatedResource";

const defaults = {
  gear_item_id: "",
  name: "",
  category: "",
  iso: "",
  aperture: "",
  shutter_speed: "",
  white_balance: "",
  exposure_compensation: "",
  notes: "",
};

export function PresetsPage() {
  const toast = useToast();
  const resource = usePaginatedResource(presetsApi.list, { per_page: 24 });
  const [gear, setGear] = useState([]);
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    gearApi
      .list({ per_page: 100 })
      .then((response) => setGear(response.data))
      .catch(() => setGear([]));
  }, []);
  function show(preset = null) {
    setEditing(preset);
    setForm(
      preset
        ? {
            ...defaults,
            ...preset,
            gear_item_id: preset.gear_item_id ? String(preset.gear_item_id) : "",
          }
        : defaults,
    );
    setError("");
    setOpen(true);
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        gear_item_id: form.gear_item_id ? Number(form.gear_item_id) : null,
        exposure_compensation:
          form.exposure_compensation === "" ? null : Number(form.exposure_compensation),
      };
      if (editing) await presetsApi.update(editing.id, payload);
      else await presetsApi.create(payload);
      toast.success(editing ? "Preset actualizado." : "Preset creado.");
      setOpen(false);
      await resource.refresh();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    try {
      await presetsApi.remove(deleting.id);
      setDeleting(null);
      toast.success("Preset eliminado.");
      await resource.refresh();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Producción"
        title="Presets de cámara"
        description="Guarda configuraciones reproducibles y vincúlalas al cuerpo o equipo con el que fueron probadas."
        action={<Button onClick={() => show()}>Nuevo preset</Button>}
      />
      <div className="mb-6">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar preset"
        />
      </div>
      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-60" />
          ))}
        </div>
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin presets"
          description="Registra configuraciones de cámara para repetir resultados consistentes."
          action={<Button onClick={() => show()}>Crear preset</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((preset) => (
              <Card key={preset.id} className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-200">
                  {preset.category || "General"}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{preset.name}</h2>
                <p className="mt-1 text-sm text-stone-400">
                  {preset.gear_item?.name || "Sin equipo asociado"}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Metric label="ISO" value={preset.iso} />
                  <Metric label="Apertura" value={preset.aperture} />
                  <Metric label="Velocidad" value={preset.shutter_speed} />
                  <Metric label="Balance" value={preset.white_balance} />
                </div>
                <div className="mt-5 flex gap-2">
                  <Button variant="secondary" onClick={() => show(preset)}>
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => setDeleting(preset)}>
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
        open={open}
        title={editing ? "Editar preset" : "Nuevo preset"}
        onClose={() => setOpen(false)}
      >
        <form className="space-y-4" onSubmit={submit}>
          {error ? <ErrorState message={error} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Categoría">
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Retrato, nocturna..."
              />
            </Field>
            <Field label="Equipo">
              <Select
                value={form.gear_item_id}
                onChange={(e) => setForm({ ...form, gear_item_id: e.target.value })}
                options={[
                  { value: "", label: "Sin equipo" },
                  ...gear.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
            </Field>
            <Field label="ISO">
              <Input
                value={form.iso}
                onChange={(e) => setForm({ ...form, iso: e.target.value })}
                placeholder="100"
              />
            </Field>
            <Field label="Apertura">
              <Input
                value={form.aperture}
                onChange={(e) => setForm({ ...form, aperture: e.target.value })}
                placeholder="f/2.8"
              />
            </Field>
            <Field label="Velocidad">
              <Input
                value={form.shutter_speed}
                onChange={(e) => setForm({ ...form, shutter_speed: e.target.value })}
                placeholder="1/250"
              />
            </Field>
            <Field label="Balance de blancos">
              <Input
                value={form.white_balance}
                onChange={(e) => setForm({ ...form, white_balance: e.target.value })}
                placeholder="5600K"
              />
            </Field>
            <Field label="Compensación EV">
              <Input
                type="number"
                min="-10"
                max="10"
                step="0.1"
                value={form.exposure_compensation}
                onChange={(e) => setForm({ ...form, exposure_compensation: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Notas">
            <Textarea
              rows="3"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end">
            <Button disabled={saving}>{saving ? "Guardando..." : "Guardar preset"}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar preset"
        description="Esta acción no afecta al equipo asociado."
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}
