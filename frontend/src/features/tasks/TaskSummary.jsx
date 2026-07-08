import { StatCard } from "../../components/ui/StatCard";

export function TaskSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Abiertas" value={summary.open} detail="Por hacer, en curso o en espera" />
      <StatCard label="Vencidas" value={summary.overdue} detail="Fecha limite superada" />
      <StatCard label="Para hoy" value={summary.dueToday} detail="Vencen en la jornada actual" />
      <StatCard
        label="Completadas"
        value={summary.byStatus.find((item) => item.status === "completed")?.total ?? 0}
        detail="Historico total"
      />
    </div>
  );
}
