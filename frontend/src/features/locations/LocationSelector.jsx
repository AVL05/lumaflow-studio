import { useEffect, useState } from 'react'
import { locationsApi } from '../../api/locations'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'

export function LocationSelector({ value, onChange, onCreate }) {
  const [locations, setLocations] = useState([])

  useEffect(() => {
    locationsApi.list({ per_page: 100, sort: 'name', direction: 'asc' })
      .then((response) => setLocations(response.data))
      .catch(() => setLocations([]))
  }, [])

  return (
    <div className="md:col-span-2">
      <Field label="Localizacion guardada">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Select
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            options={[
              { value: '', label: 'Sin localizacion guardada' },
              ...locations.map((location) => ({ value: String(location.id), label: `${location.name}${location.city ? ` · ${location.city}` : ''}` })),
            ]}
          />
          <Button type="button" variant="secondary" onClick={onCreate}>Nueva localizacion</Button>
        </div>
      </Field>
    </div>
  )
}
