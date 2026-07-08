import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { accessDifficulties, labelFor, locationTypes } from '../../utils/catalogs'
import { LocationMapPreview } from './LocationMapPreview'

export function LocationDetail({ location }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{location.name}</h1>
            <p className="mt-2 text-sm text-stone-500">{[location.city, location.country].filter(Boolean).join(', ') || 'Sin ciudad'}</p>
          </div>
          <Badge variant="warm">{labelFor(locationTypes, location.type)}</Badge>
        </div>
        <div className="mt-6 grid gap-4 text-sm text-stone-400 md:grid-cols-2">
          <p><span className="text-stone-100">Mejor hora:</span> {location.best_time || 'Sin dato'}</p>
          <p><span className="text-stone-100">Acceso:</span> {labelFor(accessDifficulties, location.access_difficulty)}</p>
          <p><span className="text-stone-100">Latitud:</span> {location.latitude}</p>
          <p><span className="text-stone-100">Longitud:</span> {location.longitude}</p>
        </div>
        <p className="mt-6 text-sm leading-6 text-stone-400">{location.notes || 'Sin notas.'}</p>
        <TagBlock title="Tags" items={location.tags} />
        <TagBlock title="Equipo recomendado" items={location.recommended_gear} />
      </Card>
      <LocationMapPreview latitude={location.latitude} longitude={location.longitude} name={location.name} />
    </div>
  )
}

function TagBlock({ title, items }) {
  if (!items?.length) return null

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-stone-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <Badge key={item}>{item}</Badge>)}
      </div>
    </div>
  )
}
