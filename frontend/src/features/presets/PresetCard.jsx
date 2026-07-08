import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { labelFor, presetCategories, presetStyles } from "../../utils/catalogs";
import { PresetPreview } from "./PresetPreview";

export function PresetCard({
  preset,
  onDetail,
  onEdit,
  onDuplicate,
  onDelete,
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-4 w-4 rounded-full border border-white/20"
            style={{ backgroundColor: preset.color }}
          />
          <div>
            <h2 className="font-semibold text-stone-50">{preset.name}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {labelFor(presetCategories, preset.category)} ·{" "}
              {labelFor(presetStyles, preset.style)}
            </p>
          </div>
        </div>
        {preset.is_favorite ? <Badge variant="warm">Favorito</Badge> : null}
      </div>
      <div className="mt-5">
        <PresetPreview preset={preset} />
      </div>
      <p className="mt-5 line-clamp-2 text-sm text-stone-500">
        {preset.recommended_use || preset.description || "Sin uso recomendado."}
      </p>
      <p className="mt-3 text-xs text-stone-600">
        v{preset.version} · {new Date(preset.created_at).toLocaleDateString()}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onDetail(preset)}>
          Detalle
        </Button>
        <Button variant="secondary" onClick={() => onDuplicate(preset)}>
          Duplicar
        </Button>
        <Button variant="secondary" onClick={() => onEdit(preset)}>
          Editar
        </Button>
        <Button variant="danger" onClick={() => onDelete(preset)}>
          Eliminar
        </Button>
      </div>
    </Card>
  );
}
