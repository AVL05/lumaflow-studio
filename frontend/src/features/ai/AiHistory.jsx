import { Card } from "../../components/ui/Card";

export function AiHistory({ items = [] }) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Actividad IA</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-stone-400">Sin actividad reciente.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.created_at}-${index}`} className="rounded-lg bg-white/[0.04] p-3">
              <p className="text-sm text-stone-300">{item.summary}</p>
              <p className="mt-1 text-xs text-stone-400">
                {item.score ? `Score ${item.score}` : "IA"}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
