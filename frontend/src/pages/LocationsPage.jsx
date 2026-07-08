import { useState } from 'react'
import { locationsApi } from '../api/locations'
import { getApiError } from '../api/client'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Pagination } from '../components/ui/Pagination'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LocationCard } from '../features/locations/LocationCard'
import { LocationFilters } from '../features/locations/LocationFilters'
import { LocationForm } from '../features/locations/LocationForm'
import { useToast } from '../features/notifications/ToastContext'
import { usePaginatedResource } from '../hooks/usePaginatedResource'

const defaults = {
  name: '',
  city: '',
  country: '',
  latitude: '',
  longitude: '',
  type: 'urban',
  best_time: '',
  access_difficulty: 'easy',
  notes: '',
  tags_text: '',
  recommended_gear_text: '',
  tags: [],
  recommended_gear: [],
  cover_photo_id: null,
}

export function LocationsPage() {
  const toast = useToast()
  const resource = usePaginatedResource(locationsApi.list, { per_page: 12, sort: 'created_at', direction: 'desc' })
  const [form, setForm] = useState(defaults)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function openCreate() {
    setEditing(null)
    setForm(defaults)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(location) {
    setEditing(location)
    setForm({
      ...defaults,
      ...location,
      tags_text: location.tags?.join(', ') ?? '',
      recommended_gear_text: location.recommended_gear?.join(', ') ?? '',
    })
    setFormError('')
    setFormOpen(true)
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      const payload = normalizeLocation(form)
      if (editing) {
        await locationsApi.update(editing.id, payload)
        toast.success('Localizacion actualizada.')
      } else {
        await locationsApi.create(payload)
        toast.success('Localizacion creada.')
      }
      setFormOpen(false)
      await resource.refresh()
    } catch (err) {
      setFormError(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    await locationsApi.remove(deleting.id)
    toast.success('Localizacion eliminada.')
    setDeleting(null)
    await resource.refresh()
  }

  return (
    <>
      <PageHeader
        eyebrow="Locations"
        title="Localizaciones"
        description="Guarda spots fotograficos con coordenadas, mejor hora, dificultad, tags y equipo recomendado."
        action={<Button onClick={openCreate}>Nueva localizacion</Button>}
      />

      <LocationFilters resource={resource} />
      {resource.error ? <ErrorState message={resource.error} /> : null}
      {resource.loading ? <LocationSkeleton /> : resource.items.length === 0 ? (
        <EmptyState title="Sin localizaciones" description="Crea tu primera localizacion fotografica." action={<Button onClick={openCreate}>Crear localizacion</Button>} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resource.items.map((location) => (
              <LocationCard key={location.id} location={location} onEdit={openEdit} onDelete={setDeleting} />
            ))}
          </div>
          <Pagination meta={resource.meta} onPage={resource.setPage} />
        </>
      )}

      <Modal open={formOpen} title={editing ? 'Editar localizacion' : 'Nueva localizacion'} onClose={() => setFormOpen(false)}>
        <LocationForm form={form} setForm={setForm} onSubmit={submit} error={formError} saving={saving} />
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} title="Eliminar localizacion" description="Esta accion elimina la localizacion guardada. No afecta sesiones ni fotos." onClose={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  )
}

function normalizeLocation(form) {
  return {
    name: form.name,
    city: form.city || null,
    country: form.country || null,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    type: form.type,
    best_time: form.best_time || null,
    access_difficulty: form.access_difficulty,
    notes: form.notes || null,
    tags: splitList(form.tags_text),
    recommended_gear: splitList(form.recommended_gear_text),
    cover_photo_id: form.cover_photo_id || null,
  }
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function LocationSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-96" />)}
    </div>
  )
}
