import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";

const tones = { up: "green", degraded: "warm", down: "red" };
const labels = { up: "Operativo", degraded: "Degradado", down: "Caido" };

/** Muestra una sonda de HealthService: estado, latencia y metadatos propios. */
export function ServiceCard({ name, description, check }) {
  const { status, latency_ms: latency, ...details } = check;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-stone-50">{name}</h2>
          <p className="mt-1 text-xs text-stone-500">{description}</p>
        </div>
        <Badge variant={tones[status] ?? "neutral"}>{labels[status] ?? status}</Badge>
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        {latency !== undefined ? (
          <div className="flex justify-between gap-3">
            <dt className="text-stone-500">Latencia</dt>
            <dd className="tabular-nums text-stone-300">{latency} ms</dd>
          </div>
        ) : null}
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3">
            <dt className="text-stone-500">{key}</dt>
            <dd className="max-w-[60%] truncate text-right text-stone-300">
              {typeof value === "boolean" ? (value ? "si" : "no") : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
