import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard";
import { getApiError } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { StatCard } from "../components/ui/StatCard";
import { ErrorState } from "../components/states/ErrorState";
import { EmptyState } from "../components/states/EmptyState";
import { labelFor, sessionStatuses, sessionTypes, toneForStatus } from "../utils/catalogs";
import { LocationMapPreview } from "../features/locations/LocationMapPreview";
import {
  ActivityWidget,
  AgendaWidget,
  FavoriteGearWidget,
  MonthlyProgressWidget,
  PendingTasksWidget,
  RemindersWidget,
  TopLocationsWidget,
} from "../features/dashboard/WorkflowWidgets";

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setDashboard)
      .catch((err) => setError(getApiError(err)));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Metricas reales del workspace creativo: sesiones, fotos, equipo, presets y actividad reciente."
      />
      {error ? <ErrorState message={error} /> : null}
      {!dashboard ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <Card className="p-6 md:p-7">
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                  Estado operativo
                </p>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-stone-50 text-balance">
                  Tu estudio esta listo para organizar produccion, entrega y archivo.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-400">
                  El dashboard resume lo que requiere atencion: agenda inmediata, tareas abiertas,
                  entregas pendientes y actividad reciente del workspace.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  ["Agenda", dashboard.todayAgenda?.length ?? 0, "eventos hoy"],
                  ["Produccion", dashboard.upcomingSessions.length, "sesiones proximas"],
                  ["Entrega", dashboard.pendingDeliveries, "pendientes"],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                      {label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold tabular-nums text-stone-50">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            <StatCard label="Sesiones" value={dashboard.totalSessions} detail="Total planificado" />
            <StatCard label="Fotos" value={dashboard.totalPhotos} detail="Imagenes en biblioteca" />
            <StatCard label="Equipo" value={dashboard.totalGear} detail="Items registrados" />
            <StatCard label="Presets" value={dashboard.totalPresets} detail="Bases de color" />
            <StatCard label="Etiquetas" value={dashboard.totalTags} detail="Taxonomia visual" />
            <StatCard
              label="Localizaciones"
              value={dashboard.totalLocations}
              detail="Spots guardados"
            />
            <StatCard
              label="Proximas"
              value={dashboard.upcomingSessions.length}
              detail="Agenda visible"
            />
            <StatCard
              label="Clientes"
              value={dashboard.totalClients}
              detail={`${dashboard.activeClients} activos`}
            />
            <StatCard
              label="Entregas pendientes"
              value={dashboard.pendingDeliveries}
              detail="Esperando envio"
            />
            <StatCard
              label="Proyectos entregados"
              value={dashboard.deliveredProjects}
              detail="Entregados o aprobados"
            />
            <StatCard
              label="Uso IA"
              value={dashboard.aiUsage?.analyses ?? 0}
              detail={`${dashboard.aiUsage?.conversations ?? 0} conversaciones`}
            />
            <StatCard
              label="Planes IA"
              value={dashboard.aiUsage?.sessionPlans ?? 0}
              detail={`${dashboard.aiUsage?.optimizedSessions ?? 0} sesiones optimizadas`}
            />
            <StatCard
              label="Tareas abiertas"
              value={dashboard.taskSummary?.open ?? 0}
              detail={`${dashboard.taskSummary?.overdue ?? 0} vencidas`}
            />
            <StatCard
              label="Avisos sin leer"
              value={dashboard.unreadNotifications ?? 0}
              detail="Centro de notificaciones"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <AgendaWidget events={dashboard.todayAgenda ?? []} />
            <PendingTasksWidget
              tasks={dashboard.pendingTasks ?? []}
              summary={dashboard.taskSummary}
            />
            <RemindersWidget reminders={dashboard.upcomingReminders ?? []} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <MonthlyProgressWidget progress={dashboard.monthlyProgress} />
            <ActivityWidget activities={dashboard.timeline ?? []} />
            <div className="grid gap-6">
              <FavoriteGearWidget gear={dashboard.favoriteGear ?? []} />
              <TopLocationsWidget locations={dashboard.favoriteLocations ?? []} />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-5">
              <h2 className="font-semibold">Ultimas localizaciones</h2>
              <div className="mt-4 space-y-3">
                {dashboard.latestLocations.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin localizaciones.</p>
                ) : (
                  dashboard.latestLocations.map((location) => (
                    <div key={location.id} className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-sm">{location.name}</p>
                      <p className="mt-1 text-xs text-stone-400">
                        {[location.city, location.country].filter(Boolean).join(", ") ||
                          "Sin ciudad"}{" "}
                        · {location.type}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Próximas sesiones con localización</h2>
              <div className="mt-4 space-y-3">
                {dashboard.upcomingSessionsWithLocation.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin sesiones futuras con ubicación.</p>
                ) : (
                  dashboard.upcomingSessionsWithLocation.map((session) => (
                    <div key={session.id} className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-sm">{session.name}</p>
                      <p className="mt-1 text-xs text-stone-400">
                        {session.date} · {session.location?.name || session.location_name}
                      </p>
                      {session.location ? (
                        <div className="mt-3">
                          <LocationMapPreview
                            latitude={session.location.latitude}
                            longitude={session.location.longitude}
                            name={session.location.name}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-semibold">Localizaciones favoritas</h2>
              <div className="mt-4 space-y-3">
                {dashboard.favoriteLocations.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin localizaciones favoritas.</p>
                ) : (
                  dashboard.favoriteLocations.map((location) => (
                    <div key={location.id} className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-sm">{location.name}</p>
                      <p className="mt-1 text-xs text-stone-400">
                        {location.city || "Sin ciudad"} ·{" "}
                        {location.rating ? `${location.rating}/5` : "Sin rating"} ·{" "}
                        {location.sessions_count ?? 0} sesiones
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Ciudades mas utilizadas</h2>
              <div className="mt-4 space-y-3">
                {dashboard.topLocationCities.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin ciudades registradas.</p>
                ) : (
                  dashboard.topLocationCities.map((city) => (
                    <div
                      key={city.city}
                      className="flex items-center justify-between rounded-md bg-white/[0.04] p-3"
                    >
                      <span className="text-sm">{city.city}</span>
                      <span className="text-xs text-stone-400">{city.total} spots</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-semibold">Clientes recientes</h2>
              <div className="mt-4 space-y-3">
                {dashboard.recentClients.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin clientes todavia.</p>
                ) : (
                  dashboard.recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between rounded-md bg-white/[0.04] p-3"
                    >
                      <div>
                        <p className="text-sm">{client.name}</p>
                        <p className="mt-1 text-xs text-stone-400">
                          {client.company || client.email || "Sin empresa/email"}
                        </p>
                      </div>
                      <Badge variant={client.status === "active" ? "green" : "neutral"}>
                        {client.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Proximas entregas</h2>
              <div className="mt-4 space-y-3">
                {dashboard.upcomingDeliveries.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin entregas futuras.</p>
                ) : (
                  dashboard.upcomingDeliveries.map((delivery) => (
                    <div key={delivery.id} className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-sm">{delivery.title}</p>
                      <p className="mt-1 text-xs text-stone-400">
                        {delivery.client?.name || "Sin cliente"} ·{" "}
                        {delivery.delivery_date || "Sin fecha"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <h2 className="font-semibold">Proximas sesiones</h2>
              <div className="mt-4 space-y-3">
                {dashboard.upcomingSessions.length === 0 ? (
                  <EmptyState
                    title="Sin sesiones proximas"
                    description="Cuando crees sesiones futuras apareceran aqui."
                  />
                ) : (
                  dashboard.upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-md border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="mt-1 text-sm text-stone-400">
                            {session.date} {session.time || ""} ·{" "}
                            {session.location_name || "Sin localizacion"}
                          </p>
                        </div>
                        <Badge variant={toneForStatus(session.status)}>
                          {labelFor(sessionStatuses, session.status)}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-stone-400">
                        {labelFor(sessionTypes, session.session_type)} ·{" "}
                        {session.client_name || "Sin cliente"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold">Sesiones por estado</h2>
              <div className="mt-5 space-y-3">
                {dashboard.sessionsByStatus.map((item) => (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">
                        {labelFor(sessionStatuses, item.status)}
                      </span>
                      <span className="text-stone-200">{item.total}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-amber-200/70"
                        style={{
                          width: `${barWidth(item.total, dashboard.totalSessions)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="p-5">
              <h2 className="font-semibold">Presets mas usados</h2>
              <div className="mt-4 space-y-3">
                {dashboard.topPresets.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin presets usados.</p>
                ) : (
                  dashboard.topPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between rounded-md bg-white/[0.04] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-sm">{preset.name}</span>
                      </div>
                      <span className="text-xs text-stone-400">{preset.usage_count} usos</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Ultimos albumes</h2>
              <div className="mt-4 space-y-3">
                {dashboard.latestAlbums.length === 0 ? (
                  <p className="text-sm text-stone-400">Sin albumes.</p>
                ) : (
                  dashboard.latestAlbums.map((album) => (
                    <div key={album.id} className="rounded-md bg-white/[0.04] p-3">
                      <p className="text-sm">{album.name}</p>
                      <p className="mt-1 text-xs text-stone-400">{album.photos_count ?? 0} fotos</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Resumen EXIF</h2>
              <div className="mt-4 grid gap-3 text-sm text-stone-400">
                <p>
                  Modelos de camara:{" "}
                  <span className="text-stone-100">{dashboard.exifSummary.cameraModels}</span>
                </p>
                <p>
                  Fotos etiquetadas:{" "}
                  <span className="text-stone-100">{dashboard.exifSummary.taggedPhotos}</span>
                </p>
                <p>
                  Etiquetas activas:{" "}
                  <span className="text-stone-100">{dashboard.exifSummary.tags}</span>
                </p>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="font-semibold">Fotos favoritas</h2>
            {dashboard.favoritePhotos.length === 0 ? (
              <p className="mt-4 text-sm text-stone-400">
                Marca fotos como favoritas para verlas aqui.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {dashboard.favoritePhotos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={photo.title || "Favorita"}
                    className="aspect-square rounded-md object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="p-5">
              <h2 className="font-semibold">IA local</h2>
              <p className="mt-4 text-sm text-stone-400">
                <span className="text-emerald-100">WebGPU en navegador</span>
              </p>
              <p className="mt-2 text-xs text-stone-400">
                Ollama backend opcional: {dashboard.ollamaStatus.available ? "disponible" : "inactivo"}
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Ultimo analisis</h2>
              {dashboard.latestAiAnalysis?.id ? (
                <div className="mt-4 text-sm text-stone-400">
                  <p>{dashboard.latestAiAnalysis.summary}</p>
                  <p className="mt-2 text-amber-100">
                    Score {dashboard.latestAiAnalysis.score}/100
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-stone-400">Sin analisis IA todavia.</p>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Recomendaciones IA</h2>
              {dashboard.latestAiRecommendations.length === 0 ? (
                <p className="mt-4 text-sm text-stone-400">Sin recomendaciones.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {dashboard.latestAiRecommendations.map((item, index) => (
                    <p key={`${item.created_at}-${index}`} className="text-sm text-stone-400">
                      {item.summary}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="font-semibold">Ultimos planes IA</h2>
            {dashboard.latestAiSessionPlans?.length === 0 ? (
              <p className="mt-4 text-sm text-stone-400">Sin planes de sesion generados.</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {dashboard.latestAiSessionPlans?.map((plan) => (
                  <div key={plan.id} className="rounded-md bg-white/[0.04] p-4">
                    <p className="text-sm font-medium">{plan.title}</p>
                    <p className="mt-2 text-sm text-stone-400">{plan.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

function barWidth(total, base) {
  if (!base) return 0;
  return Math.max(6, Math.round((total / base) * 100));
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <Skeleton key={item} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
