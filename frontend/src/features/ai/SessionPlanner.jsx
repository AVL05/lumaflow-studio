import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { JsonViewer } from './JsonViewer'

export function SessionPlanner({ sessions, onPlan, loading, plan }) {
  const [form, setForm] = useState({ session_id: '', goals: '', constraints: '' })

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Planificador de sesiones</h2>
      <div className="mt-4 space-y-3">
        <Select value={form.session_id} onChange={(event) => update('session_id', event.target.value)} options={[{ value: '', label: 'Selecciona sesion' }, ...sessions.map((session) => ({ value: String(session.id), label: session.name }))]} />
        <Textarea rows="3" value={form.goals} onChange={(event) => update('goals', event.target.value)} placeholder="Objetivos de la sesion" />
        <Textarea rows="3" value={form.constraints} onChange={(event) => update('constraints', event.target.value)} placeholder="Restricciones: clima, horario, cliente, permisos..." />
      </div>
      <Button className="mt-4" onClick={() => onPlan({ ...form, session_id: Number(form.session_id) })} disabled={loading || !form.session_id}>{loading ? 'Planificando...' : 'Generar plan'}</Button>
      {plan ? <div className="mt-5"><JsonViewer value={plan.plan} /></div> : null}
    </Card>
  )
}
