import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { buildMarkerIcon } from './MapMarker'
import 'leaflet/dist/leaflet.css'

const defaultCenter = [40.4168, -3.7038]

export function MapView({
  center,
  markers = [],
  zoom = 13,
  height = 'h-80',
  selectable = false,
  selected,
  onSelect,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerRef = useRef(null)
  const [leaflet, setLeaflet] = useState(null)
  const [map, setMap] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let mounted = true
    import('leaflet').then((module) => {
      if (mounted) setLeaflet(module.default)
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!leaflet || !mapRef.current || mapInstanceRef.current) return

    const initialCenter = normalizedCenter(center, markers, selected)
    const instance = leaflet.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(initialCenter, zoom)

    leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20,
    }).addTo(instance)

    layerRef.current = leaflet.layerGroup().addTo(instance)
    mapInstanceRef.current = instance
    setMap(instance)

    return () => {
      instance.remove()
      mapInstanceRef.current = null
      setMap(null)
    }
  }, [center, leaflet, markers, selected, zoom])

  useEffect(() => {
    if (!map || !leaflet || !layerRef.current) return

    layerRef.current.clearLayers()
    const bounds = []

    markers.forEach((marker) => {
      if (!isValidCoord(marker.latitude, marker.longitude)) return
      const point = [Number(marker.latitude), Number(marker.longitude)]
      bounds.push(point)
      leaflet.marker(point, { icon: buildMarkerIcon(leaflet, marker.id === selected?.id) })
        .bindPopup(`<strong>${escapeHtml(marker.name || 'Localizacion')}</strong><br>${escapeHtml(marker.meta || '')}`)
        .addTo(layerRef.current)
    })

    if (selected && isValidCoord(selected.latitude, selected.longitude)) {
      const point = [Number(selected.latitude), Number(selected.longitude)]
      bounds.push(point)
      leaflet.marker(point, { icon: buildMarkerIcon(leaflet, true) })
        .bindPopup(`<strong>${escapeHtml(selected.name || 'Seleccion')}</strong>`)
        .addTo(layerRef.current)
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 })
    } else if (bounds.length === 1) {
      map.setView(bounds[0], zoom)
    }
  }, [leaflet, map, markers, selected, zoom])

  useEffect(() => {
    if (!map || !selectable) return

    const handleClick = (event) => {
      onSelect?.({
        latitude: Number(event.latlng.lat.toFixed(7)),
        longitude: Number(event.latlng.lng.toFixed(7)),
      })
    }

    map.on('click', handleClick)
    return () => map.off('click', handleClick)
  }, [map, onSelect, selectable])

  function applyCoordinateSearch(event) {
    event.preventDefault()
    const [lat, lng] = query.split(',').map((value) => Number(value.trim()))
    if (!isValidCoord(lat, lng)) return
    onSelect?.({ latitude: Number(lat.toFixed(7)), longitude: Number(lng.toFixed(7)) })
    map?.setView([lat, lng], zoom)
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-white/10 bg-[#11100e] ${height}`}>
      <div ref={mapRef} className="h-full min-h-full w-full" aria-label="Mapa interactivo de localizaciones" />
      {!leaflet ? (
        <div className="absolute inset-0 grid place-items-center bg-[#11100e] text-sm text-stone-500">Cargando mapa...</div>
      ) : null}
      {selectable ? (
        <form onSubmit={applyCoordinateSearch} className="absolute left-3 top-3 z-[500] flex max-w-[calc(100%-1.5rem)] gap-2">
          <input
            className="w-56 rounded-md border border-white/10 bg-black/70 px-3 py-2 text-xs text-stone-100 outline-none backdrop-blur placeholder:text-stone-500"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="40.4168, -3.7038"
            aria-label="Buscar coordenadas"
          />
          <Button variant="secondary" className="bg-black/70 px-3 py-2 text-xs">Ir</Button>
        </form>
      ) : null}
    </div>
  )
}

function normalizedCenter(center, markers, selected) {
  if (selected && isValidCoord(selected.latitude, selected.longitude)) return [Number(selected.latitude), Number(selected.longitude)]
  if (center && isValidCoord(center[0], center[1])) return [Number(center[0]), Number(center[1])]
  const first = markers.find((marker) => isValidCoord(marker.latitude, marker.longitude))
  if (first) return [Number(first.latitude), Number(first.longitude)]
  return defaultCenter
}

function isValidCoord(latitude, longitude) {
  return Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char])
}
