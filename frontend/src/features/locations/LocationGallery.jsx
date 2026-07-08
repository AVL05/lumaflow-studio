import { Card } from '../../components/ui/Card'

export function LocationGallery({ photos = [], coverPhoto }) {
  const items = photos.length ? photos : coverPhoto ? [coverPhoto] : []

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Fotografias del spot</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">Sin fotografias asociadas.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.title || photo.file_name || 'Foto de localizacion'}
              className="aspect-[4/3] rounded-md object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </Card>
  )
}
