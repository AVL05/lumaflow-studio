import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { locationsApi } from '../api/locations'
import { getApiError } from '../api/client'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/states/ErrorState'
import { LocationDetail } from '../features/locations/LocationDetail'

export function LocationDetailPage() {
  const { id } = useParams()
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
      {!location ? <Skeleton className="h-96" /> : <LocationDetail location={location} />}
    </>
  )
}
