import { Card } from "../../components/ui/Card";

export function ModelStatus({ status }) {
  const provider = status?.provider === "webgpu" ? "WebGPU" : "Ollama";
  const detail = status?.loadingText || status?.error || status?.model || "Sin modelo";

  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{provider}</p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className={status?.available ? "text-emerald-100" : "text-red-100"}>
            {status?.available ? "Disponible" : "No disponible"}
          </p>
          <p className="mt-1 text-sm text-stone-400">{detail}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-400">
          {status?.streaming_supported ? "streaming local" : "respuesta completa"}
        </span>
      </div>
    </Card>
  );
}
