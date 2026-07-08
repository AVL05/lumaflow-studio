import { Card } from '../../components/ui/Card'

export function InsightCard({ label, value, detail }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-stone-100">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{detail}</p>
    </Card>
  )
}
