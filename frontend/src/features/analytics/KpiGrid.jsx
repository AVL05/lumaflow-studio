import { StatCard } from "../../components/ui/StatCard";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function trendLabel(value) {
  if (value === 0) return "Sin variacion";

  return `${value > 0 ? "+" : ""}${value}% vs periodo anterior`;
}

export function KpiGrid({ kpis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Sesiones" value={kpis.sessions} detail={trendLabel(kpis.sessionsTrend)} />
      <StatCard
        label="Sesiones cerradas"
        value={kpis.completedSessions}
        detail="Realizadas o entregadas"
      />
      <StatCard label="Fotografias" value={kpis.photos} detail="Subidas en el rango" />
      <StatCard
        label="Facturado"
        value={currency.format(kpis.revenue)}
        detail={`Pipeline ${currency.format(kpis.pipeline)}`}
      />
      <StatCard label="Clientes activos" value={kpis.activeClients} detail="Cartera viva" />
      <StatCard
        label="Tareas abiertas"
        value={kpis.openTasks}
        detail={`${kpis.overdueTasks} vencidas`}
      />
      <StatCard label="Interacciones IA" value={kpis.aiInteractions} detail="Analisis y chats" />
      <StatCard
        label="Tasa de cierre"
        value={`${kpis.sessions > 0 ? Math.round((kpis.completedSessions / kpis.sessions) * 100) : 0}%`}
        detail="Sesiones cerradas / totales"
      />
    </div>
  );
}
