import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { ErrorState } from '../../components/states/ErrorState'
import { accessDifficulties, locationTypes } from '../../utils/catalogs'

export function LocationForm({ form, setForm, onSubmit, error, saving }) {
  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      {error ? <div className="md:col-span-2"><ErrorState message={error} /></div> : null}
      <Field label="Nombre"><Input required value={form.name} onChange={(event) => setValue('name', event.target.value)} /></Field>
      <Field label="Tipo"><Select value={form.type} onChange={(event) => setValue('type', event.target.value)} options={locationTypes} /></Field>
      <Field label="Ciudad"><Input value={form.city ?? ''} onChange={(event) => setValue('city', event.target.value)} /></Field>
      <Field label="Pais"><Input value={form.country ?? ''} onChange={(event) => setValue('country', event.target.value)} /></Field>
      <Field label="Latitud"><Input required type="number" step="0.0000001" value={form.latitude} onChange={(event) => setValue('latitude', event.target.value)} /></Field>
      <Field label="Longitud"><Input required type="number" step="0.0000001" value={form.longitude} onChange={(event) => setValue('longitude', event.target.value)} /></Field>
      <Field label="Mejor hora"><Input value={form.best_time ?? ''} onChange={(event) => setValue('best_time', event.target.value)} /></Field>
      <Field label="Dificultad"><Select value={form.access_difficulty} onChange={(event) => setValue('access_difficulty', event.target.value)} options={accessDifficulties} /></Field>
      <div className="md:col-span-2"><Field label="Tags"><Input value={form.tags_text ?? ''} onChange={(event) => setValue('tags_text', event.target.value)} placeholder="blue hour, editorial, cars" /></Field></div>
      <div className="md:col-span-2"><Field label="Equipo recomendado"><Input value={form.recommended_gear_text ?? ''} onChange={(event) => setValue('recommended_gear_text', event.target.value)} placeholder="35mm, tripod, flash" /></Field></div>
      <div className="md:col-span-2"><Field label="Notas"><Textarea rows="4" value={form.notes ?? ''} onChange={(event) => setValue('notes', event.target.value)} /></Field></div>
      <div className="md:col-span-2 flex justify-end"><Button disabled={saving}>{saving ? 'Guardando...' : 'Guardar localizacion'}</Button></div>
    </form>
  )
}
