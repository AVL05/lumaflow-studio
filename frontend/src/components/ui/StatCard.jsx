import { Card } from "./Card";

export function StatCard({ label, value, detail }) {
  return (
    <Card className="min-h-36 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
          {label}
        </p>
        <span className="h-2 w-2 rounded-full bg-amber-200/60 shadow-[0_0_18px_rgba(245,211,141,.45)]" />
      </div>
      <p className="mt-6 text-4xl font-semibold tracking-tight text-stone-50 tabular-nums">
        {value}
      </p>
      {detail ? <p className="mt-2 text-sm leading-5 text-stone-400">{detail}</p> : null}
    </Card>
  );
}
