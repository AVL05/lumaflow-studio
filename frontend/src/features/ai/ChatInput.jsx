import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'

export function ChatInput({ value, onChange, onSubmit, disabled }) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Textarea
        rows="4"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ej: prepara checklist para sesion urbana nocturna con mi equipo favorito"
      />
      <Button disabled={disabled || !value.trim()}>{disabled ? 'Pensando...' : 'Enviar'}</Button>
    </form>
  )
}
