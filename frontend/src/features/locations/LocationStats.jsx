import { Card } from "../../components/ui/Card";

export function LocationStats({ location }) {
  const stats = [
    ["Rating", location.rating ? `${location.rating}/5` : "Sin valorar"],
    ["Sesiones", location.sessions_count ?? location.sessions?.length ?? 0],
    ["Favorita", location.is_favorite ? "Si" : "No"],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map(([label, value]) => (
        <Card key={label} className="p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-400">{label}</p>
          <p className="mt-2 text-lg font-semibold text-stone-100">{value}</p>
        </Card>
      ))}
    </div>
  );
}
