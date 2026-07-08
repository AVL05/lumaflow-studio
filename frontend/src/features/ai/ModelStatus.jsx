import { Card } from '../../components/ui/Card'

export function ModelStatus({ status }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Ollama</p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className={status?.available ? 'text-emerald-100' : 'text-red-100'}>
            {status?.available ? 'Disponible' : 'No disponible'}
          </p>
          <p className="mt-1 text-sm text-stone-500">{status?.model || 'Sin modelo'}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-400">
          {status?.streaming_supported ? 'streaming preparado' : 'respuesta completa'}
        </span>
      </div>
    </Card>
  )
}
