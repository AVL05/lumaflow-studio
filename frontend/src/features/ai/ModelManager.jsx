import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function ModelManager({
  models,
  activeModelId,
  installedModelIds,
  busyModelId,
  loadingText,
  storageEstimate,
  onInstall,
  onSelect,
  onUninstall,
}) {
  const storageUsage = formatBytes(storageEstimate?.usage);
  const storageQuota = formatBytes(storageEstimate?.quota);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-stone-400">Modelos WebGPU</p>
          <h2 className="mt-2 text-lg font-semibold">Biblioteca local</h2>
        </div>
        {loadingText ? (
          <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs text-amber-100">
            {loadingText}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StorageStat label="Instalados" value={`${installedModelIds.length}/${models.length}`} />
        <StorageStat label="Storage usado" value={storageUsage ?? "No disponible"} />
        <StorageStat
          label="Cuota navegador"
          value={
            storageQuota ? `${storageQuota} (${storageEstimate.usagePercent}%)` : "No disponible"
          }
        />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => {
          const installed = installedModelIds.includes(model.id);
          const active = activeModelId === model.id;
          const busy = busyModelId === model.id;

          return (
            <div
              key={model.id}
              className={`rounded-lg border p-4 transition ${
                active
                  ? "border-amber-200/40 bg-amber-200/[0.07]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-100">{model.name}</p>
                  <p className="mt-1 text-xs text-stone-400">{model.size}</p>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-stone-300">
                  {active ? "Activo" : installed ? "Instalado" : model.badge}
                </span>
              </div>
              <p className="mt-3 min-h-12 text-sm leading-5 text-stone-400">{model.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <ModelFact label="Perfil" value={model.profile} />
                <ModelFact label="Descarga" value={model.downloadSize} />
                <ModelFact label="VRAM" value={model.vram} />
                <ModelFact label="Hardware" value={model.hardware} wide />
              </dl>
              {model.warning ? (
                <p className="mt-3 rounded-lg border border-amber-200/15 bg-amber-200/[0.06] px-3 py-2 text-xs leading-5 text-amber-100/90">
                  {model.warning}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {installed ? (
                  <Button
                    type="button"
                    variant={active ? "secondary" : "primary"}
                    onClick={() => onSelect(model.id)}
                    disabled={active || Boolean(busyModelId)}
                  >
                    {active ? "En uso" : "Usar"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => onInstall(model.id)}
                    disabled={Boolean(busyModelId)}
                  >
                    {busy ? "Instalando..." : "Instalar"}
                  </Button>
                )}
                {installed ? (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => onUninstall(model.id)}
                    disabled={Boolean(busyModelId)}
                  >
                    Desinstalar
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function StorageStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/15 p-3">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-stone-100">{value}</p>
    </div>
  );
}

function ModelFact({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-1 leading-5 text-stone-200">{value}</dd>
    </div>
  );
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
