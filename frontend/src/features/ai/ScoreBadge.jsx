export function ScoreBadge({ score }) {
  const value = Math.round(Number(score ?? 0))
  const tone = value >= 80 ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' : value >= 60 ? 'border-amber-200/25 bg-amber-200/10 text-amber-100' : 'border-red-300/25 bg-red-300/10 text-red-100'

  return <span className={`rounded-full border px-3 py-1 text-sm font-medium ${tone}`}>{value}/100</span>
}
