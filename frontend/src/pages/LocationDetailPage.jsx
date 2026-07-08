import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { locationsApi } from '../api/locations'
import { getApiError } from '../api/client'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/states/ErrorState'
import { LocationDetail } from '../features/locations/LocationDetail'
import { useToast } from '../features/notifications/ToastContext'

export function LocationDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    locationsApi.show(id).then(setLocation).catch((err) => setError(getApiError(err)))
  }, [id])

  return (
    <>
      <PageHeader
        eyebrow="Location detail"
        title={location?.name ?? 'Localizacion'}
        description="Detalle operativo y preview preparado para Leaflet."
        action={<Link to="/app/locations"><Button variant="secondary">Volver</Button></Link>}
      />
      {error ? <ErrorState message={error} /> : null}
      {!location ? <Skeleton className="h-96" /> : <LocationDetail location={location} onCopy={() => copyCoordinates(location, toast)} />}
    </>
  )
}

async function copyCoordinates(location, toast) {
  const value = `${location.latitude}, ${location.longitude}`
  await navigator.clipboard.writeText(value)
  toast.success('Coordenadas copiadas.')
}
