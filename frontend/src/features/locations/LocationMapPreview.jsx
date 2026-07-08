export function LocationMapPreview({ latitude, longitude, name }) {
  const valid = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined

  return (
    <div className="relative min-h-48 overflow-hidden rounded-lg border border-white/10 bg-[#11100e]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="relative grid min-h-48 place-items-center p-6 text-center">
        <div>
          <div className="mx-auto mb-3 h-4 w-4 rounded-full bg-amber-200 shadow-[0_0_24px_rgba(253,230,138,0.55)]" />
          <p className="font-medium text-stone-100">{name || 'Localizacion'}</p>
          <p className="mt-2 text-sm text-stone-500">{valid ? `${latitude}, ${longitude}` : 'Coordenadas pendientes'}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-600">Leaflet ready placeholder</p>
        </div>
      </div>
    </div>
  )
}
