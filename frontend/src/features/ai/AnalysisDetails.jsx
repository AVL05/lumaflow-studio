import { JsonViewer } from './JsonViewer'

export function AnalysisDetails({ analysis }) {
  if (!analysis) return <p className="text-sm text-stone-500">Selecciona una foto y genera un analisis.</p>

  const result = analysis.result ?? {}

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {['composition', 'ruleOfThirds', 'horizon', 'symmetry', 'depth', 'exposure', 'color', 'sharpness'].map((key) => (
          <div key={key} className="rounded-lg bg-white/[0.04] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-stone-500">{key}</p>
            <p className="mt-2 text-sm text-stone-300">{result[key] || 'Sin dato'}</p>
          </div>
        ))}
      </div>
      <JsonViewer value={result} />
    </div>
  )
}
