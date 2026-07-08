import { Card } from '../../components/ui/Card'
import { ScoreBadge } from './ScoreBadge'

export function AnalysisCard({ analysis }) {
  if (!analysis) return null

  const result = analysis.result ?? {}

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Analisis fotografico</h2>
          <p className="mt-1 text-sm text-stone-500">{analysis.summary}</p>
        </div>
        <ScoreBadge score={analysis.score} />
      </div>
      <div className="mt-5 grid gap-3 text-sm text-stone-400 md:grid-cols-2">
        {['composition', 'lighting', 'exposure', 'contrast', 'sharpness', 'whiteBalance', 'color', 'style'].map((key) => (
          <p key={key}><span className="text-stone-100">{key}:</span> {result[key] || 'Sin dato'}</p>
        ))}
      </div>
      <List title="Fortalezas" items={result.strengths} />
      <List title="Debilidades" items={result.weaknesses} />
      <List title="Recomendaciones" items={result.recommendations} />
      {result.presetSuggestion ? <p className="mt-4 text-sm text-amber-100">Preset sugerido: {result.presetSuggestion}</p> : null}
    </Card>
  )
}

function List({ title, items = [] }) {
  if (!items.length) return null

  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-stone-400">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  )
}
