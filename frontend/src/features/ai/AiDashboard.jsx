import { InsightCard } from "./InsightCard";
import { ModelStatus } from "./ModelStatus";

export function AiDashboard({ status, dashboard }) {
  const usage = dashboard?.aiUsage ?? {};

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ModelStatus status={status} />
      <InsightCard
        label="Conversaciones"
        value={usage.conversations ?? 0}
        detail="Historial guardado"
      />
      <InsightCard label="Recomendaciones" value={usage.analyses ?? 0} detail="Equipo recomendado" />
      <InsightCard
        label="Sesiones optimizadas"
        value={usage.optimizedSessions ?? 0}
        detail="Planes generados"
      />
    </div>
  );
}
