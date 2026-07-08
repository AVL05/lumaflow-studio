import { useCallback, useState } from "react";
import { analyticsApi } from "../api/analytics";
import { exportsApi } from "../api/exports";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/states/ErrorState";
import { AnalyticsTable } from "../features/analytics/AnalyticsTable";
import { DateRangeFilter } from "../features/analytics/DateRangeFilter";
import { KpiGrid } from "../features/analytics/KpiGrid";
import {
  AiUsageChart,
  ClientsByStatusChart,
  GearUsageChart,
  PhotosByCategoryChart,
  PresetUsageChart,
  ProjectStatusChart,
  SessionTypesChart,
  SessionsByMonthChart,
  TasksByStatusChart,
} from "../features/analytics/charts";
import { addDays, todayIso } from "../features/calendar/calendarUtils";
import { useToast } from "../features/notifications/ToastContext";
import { usePersistedState } from "../hooks/usePersistedState";
import { useResource } from "../hooks/useResource";

const exportResources = [
  { value: "sessions", label: "Sesiones" },
  { value: "clients", label: "Clientes" },
  { value: "deliveries", label: "Entregas" },
  { value: "tasks", label: "Tareas" },
  { value: "photos", label: "Fotos" },
  { value: "gear", label: "Equipo" },
  { value: "presets", label: "Presets" },
  { value: "locations", label: "Localizaciones" },
];

export function AnalyticsPage() {
  const toast = useToast();
  const [range, setRange] = usePersistedState("analytics-range", {
    from: addDays(todayIso(), -365),
    to: todayIso(),
  });
  const [exportResource, setExportResource] = useState("sessions");

  const fetcher = useCallback(() => analyticsApi.summary(range), [range]);
  const { data, loading, error } = useResource(fetcher);

  async function exportCsv() {
    try {
      await exportsApi.csv(exportResource);
      toast.success("Exportacion generada.");
    } catch {
      toast.error("No se pudo generar la exportacion.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Analitica"
        description="KPIs, graficas y comparativas calculadas sobre datos reales de tu estudio."
        action={
          <Select
            value={exportResource}
            onChange={(event) => setExportResource(event.target.value)}
            options={exportResources}
          />
        }
      />

      <DateRangeFilter range={range} onChange={setRange} onExport={exportCsv} />

      {error ? <ErrorState message={error} /> : null}

      {loading || !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <KpiGrid kpis={data.kpis} />

          <div className="grid gap-4 xl:grid-cols-2">
            <SessionsByMonthChart data={data.sessionsByMonth} />
            <SessionTypesChart data={data.sessionTypes} />
            <ProjectStatusChart data={data.projectStatus} />
            <ClientsByStatusChart data={data.clientsByStatus} />
            <PresetUsageChart data={data.presetUsage} />
            <GearUsageChart data={data.gearUsage} />
            <PhotosByCategoryChart data={data.photosByCategory} />
            <TasksByStatusChart data={data.tasksByStatus} />
            <div className="xl:col-span-2">
              <AiUsageChart data={data.aiUsage} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AnalyticsTable
              title="Localizaciones mas utilizadas"
              description="Sesiones asociadas a cada spot guardado"
              rows={data.topLocations}
              valueLabel="Sesiones"
              metaLabel="Ciudad"
            />
            <AnalyticsTable
              title="Presets por uso"
              description="Contador real de aplicaciones"
              rows={data.presetUsage}
              valueLabel="Usos"
              metaLabel="Estilo"
            />
          </div>

          <p className="text-xs text-stone-600">
            Rango analizado: {data.range.from} → {data.range.to}. Exportacion PDF prevista para la
            siguiente fase; CSV y JSON ya disponibles desde el backend.
          </p>
        </div>
      )}
    </>
  );
}
