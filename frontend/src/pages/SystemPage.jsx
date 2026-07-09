import { useCallback, useEffect, useState } from "react";
import { systemApi } from "../api/system";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Panel } from "../components/ui/Panel";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/states/ErrorState";
import { useAuth } from "../features/auth/AuthContext";
import { ServiceCard } from "../features/system/ServiceCard";
import { useResource } from "../hooks/useResource";

const services = [
  ["api", "API", "Aplicacion Laravel que sirve la REST API."],
  ["database", "Base de datos", "Conexion MySQL y esquema de la aplicacion."],
  ["storage", "Storage", "Disco publico donde viven las fotografias."],
  ["cache", "Cache", "Store usado por el rate limiting y sondas de estado."],
  ["ollama", "Ollama backend", "Compatibilidad opcional; la SPA usa WebGPU en navegador."],
];

const overall = {
  up: ["green", "Todos los servicios operativos"],
  degraded: ["warm", "Servicio opcional no disponible"],
  down: ["red", "Hay un servicio critico caido"],
};

const REFRESH_MS = 30_000;

export function SystemPage() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useResource(useCallback(() => systemApi.status(), []));
  const [copied, setCopied] = useState(false);

  const feedUrl = user?.calendar_token
    ? `${(import.meta.env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "")}/public/calendar/${user.calendar_token}`
    : null;

  async function copyFeedUrl() {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    const timer = window.setInterval(refresh, REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [refresh]);

  const [tone, message] = data ? (overall[data.status] ?? ["neutral", data.status]) : [];

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Estado del sistema"
        description="Sondas en vivo de la API, la base de datos, el storage, la cache y el modelo de IA local."
        action={
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            {loading ? "Comprobando..." : "Actualizar"}
          </Button>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map(([key]) => (
            <Skeleton key={key} className="h-48" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-6">
          <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Estado global</p>
              <p className="mt-2 text-sm text-stone-300">{message}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={tone}>{data.status}</Badge>
              <span className="text-xs tabular-nums text-stone-400">
                {new Date(data.timestamp).toLocaleTimeString("es-ES")}
              </span>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map(([key, name, description]) =>
              data.checks[key] ? (
                <ServiceCard
                  key={key}
                  name={name}
                  description={description}
                  check={data.checks[key]}
                />
              ) : null,
            )}
          </div>

          {feedUrl ? (
            <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-stone-400">
                  Sincronizacion de calendario
                </p>
                <p className="mt-2 truncate text-sm text-stone-300">
                  Suscribe este feed en Google Calendar, Apple Calendar u Outlook para ver tus
                  sesiones, entregas y tareas en tu calendario habitual.
                </p>
                <p className="mt-2 truncate text-xs text-amber-100">{feedUrl}</p>
              </div>
              <Button variant="secondary" onClick={copyFeedUrl}>
                {copied ? "Copiado" : "Copiar enlace"}
              </Button>
            </Panel>
          ) : null}

          <p className="text-xs text-stone-400">
            Se refresca cada 30 segundos. Ollama es opcional: si no responde, el backend queda
            degradado, pero la experiencia principal de IA usa WebGPU en el navegador.
          </p>
        </div>
      ) : null}
    </>
  );
}
