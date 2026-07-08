import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { JsonViewer } from './JsonViewer'

export function GearRecommendation({ onRecommend, loading, recommendation }) {
  const [form, setForm] = useState({ session_type: 'portrait', location: '', weather: '', time: '' })

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Recomendador de equipo</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Input value={form.session_type} onChange={(event) => update('session_type', event.target.value)} placeholder="Tipo de sesion" />
        <Input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Localizacion" />
        <Input value={form.weather} onChange={(event) => update('weather', event.target.value)} placeholder="Clima" />
        <Input value={form.time} onChange={(event) => update('time', event.target.value)} placeholder="Hora" />
      </div>
      <Button className="mt-4" onClick={() => onRecommend(form)} disabled={loading}>{loading ? 'Calculando...' : 'Recomendar equipo'}</Button>
      {recommendation ? <div className="mt-5"><JsonViewer value={recommendation.result} /></div> : null}
    </Card>
  )
}
