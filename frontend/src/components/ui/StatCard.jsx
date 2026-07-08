import { Card } from "./Card";

export function StatCard({ label, value, detail }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-stone-50">{value}</p>
      {detail ? <p className="mt-2 text-sm text-stone-500">{detail}</p> : null}
    </Card>
  );
}
