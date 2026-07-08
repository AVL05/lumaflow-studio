import { useState } from "react";
import { gearApi } from "../api/gear";
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
import { gearCategories, gearConditions, labelFor } from "../utils/catalogs";

const defaults = {
  name: "",
  category: "camera",
  brand: "",
  model: "",
  weight_grams: "",
  condition: "active",
  purchase_date: "",
  purchase_price: "",
  notes: "",
  is_favorite: false,
};

export function GearPage() {
  const toast = useToast();
  const resource = usePaginatedResource(gearApi.list, {
    per_page: 12,
    sort: "created_at",
    direction: "desc",
  });
  const [form, setForm] = useState(defaults);
  const [editing, setEditing] = useState(null);
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

  function openEdit(item) {
    setEditing(item);
    setForm({
      ...defaults,
      ...item,
      weight_grams: item.weight_grams ?? "",
      purchase_price: item.purchase_price ?? "",
      purchase_date: item.purchase_date ?? "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    const payload = {
      ...form,
      weight_grams: form.weight_grams === "" ? null : Number(form.weight_grams),
      purchase_price:
        form.purchase_price === "" ? null : Number(form.purchase_price),
      purchase_date: form.purchase_date || null,
    };

    try {
      if (editing) {
        await gearApi.update(editing.id, payload);
        toast.success("Equipo actualizado.");
      } else {
        await gearApi.create(payload);
        toast.success("Equipo creado.");
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
    await gearApi.remove(deleting.id);
    toast.success("Equipo eliminado.");
    setDeleting(null);
    await resource.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Equipment"
        title="Equipo"
        description="Inventario fotografico con categorias, favoritos, estado, compra y busqueda."
        action={<Button onClick={openCreate}>Nuevo item</Button>}
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_190px_150px_160px_140px]">
        <SearchBar
          value={resource.filters.search ?? ""}
          onChange={(value) => resource.updateFilter("search", value)}
          placeholder="Buscar por nombre, marca o modelo"
        />
        <Select
          value={resource.filters.category ?? ""}
          onChange={(e) => resource.updateFilter("category", e.target.value)}
          options={[
            { value: "", label: "Todas las categorias" },
            ...gearCategories,
          ]}
        />
        <Select
          value={resource.filters.favorites ?? ""}
          onChange={(e) => resource.updateFilter("favorites", e.target.value)}
          options={[
            { value: "", label: "Todos" },
            { value: "true", label: "Favoritos" },
            { value: "false", label: "No favoritos" },
          ]}
        />
        <Select
          value={resource.filters.sort ?? "created_at"}
          onChange={(e) => resource.updateFilter("sort", e.target.value)}
          options={[
            { value: "created_at", label: "Reciente" },
            { value: "name", label: "Nombre" },
            { value: "category", label: "Categoria" },
            { value: "brand", label: "Marca" },
            { value: "purchase_date", label: "Compra" },
          ]}
        />
        <Select
          value={resource.filters.direction ?? "desc"}
          onChange={(e) => resource.updateFilter("direction", e.target.value)}
          options={[
            { value: "desc", label: "Desc" },
            { value: "asc", label: "Asc" },
          ]}
        />
      </div>

      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? (
        <GearSkeleton />
      ) : resource.items.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No hay equipo que coincida con los filtros actuales."
          action={<Button onClick={openCreate}>Registrar equipo</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((item) => {
              const category = gearCategories.find(
                (option) => option.value === item.category,
              );
              return (
                <Card key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-md border border-white/10 bg-white/[0.05] text-xs text-amber-100">
                        {category?.icon ?? "EQ"}
                      </div>
                      <div>
                        <h2 className="font-semibold">{item.name}</h2>
                        <p className="mt-1 text-sm text-stone-500">
                          {[item.brand, item.model].filter(Boolean).join(" ") ||
                            "Sin marca/modelo"}
                        </p>
                      </div>
                    </div>
                    {item.is_favorite ? (
                      <Badge variant="warm">Favorito</Badge>
                    ) : null}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-stone-400">
                    <span>{labelFor(gearCategories, item.category)}</span>
                    <span>{labelFor(gearConditions, item.condition)}</span>
                    <span>
                      {item.weight_grams
                        ? `${item.weight_grams} g`
                        : "Sin peso"}
                    </span>
                    <span>
                      {item.purchase_price
                        ? `${item.purchase_price} EUR`
                        : "Sin precio"}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openEdit(item)}>
                      Editar
                    </Button>
                    <Button variant="danger" onClick={() => setDeleting(item)}>
                      Eliminar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Editar equipo" : "Nuevo equipo"}
        onClose={() => setFormOpen(false)}
      >
        <GearForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          error={formError}
          saving={saving}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar equipo"
        description="Esta accion eliminara el item del inventario."
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function GearForm({ form, setForm, onSubmit, error, saving }) {
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
      <Field label="Categoria">
        <Select
          value={form.category}
          onChange={(e) => setValue("category", e.target.value)}
          options={gearCategories}
        />
      </Field>
      <Field label="Marca">
        <Input
          value={form.brand ?? ""}
          onChange={(e) => setValue("brand", e.target.value)}
        />
      </Field>
      <Field label="Modelo">
        <Input
          value={form.model ?? ""}
          onChange={(e) => setValue("model", e.target.value)}
        />
      </Field>
      <Field label="Peso gramos">
        <Input
          type="number"
          min="0"
          value={form.weight_grams ?? ""}
          onChange={(e) => setValue("weight_grams", e.target.value)}
        />
      </Field>
      <Field label="Estado">
        <Select
          value={form.condition}
          onChange={(e) => setValue("condition", e.target.value)}
          options={gearConditions}
        />
      </Field>
      <Field label="Fecha de compra">
        <Input
          type="date"
          value={form.purchase_date ?? ""}
          onChange={(e) => setValue("purchase_date", e.target.value)}
        />
      </Field>
      <Field label="Precio">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.purchase_price ?? ""}
          onChange={(e) => setValue("purchase_price", e.target.value)}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Notas">
          <Textarea
            rows="3"
            value={form.notes ?? ""}
            onChange={(e) => setValue("notes", e.target.value)}
          />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm text-stone-300 md:col-span-2">
        <input
          className="h-5 w-5 accent-amber-200"
          type="checkbox"
          checked={Boolean(form.is_favorite)}
          onChange={(e) => setValue("is_favorite", e.target.checked)}
        />
        Marcar como favorito
      </label>
      <div className="md:col-span-2 flex justify-end">
        <Button disabled={saving}>
          {saving ? "Guardando..." : "Guardar equipo"}
        </Button>
      </div>
    </form>
  );
}

function GearSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Skeleton key={item} className="h-52" />
      ))}
    </div>
  );
}
