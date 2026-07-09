import { useRef, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Panel } from "../../components/ui/Panel";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { checklistTypes, labelFor } from "../../utils/catalogs";
import { ChecklistItemRow } from "./ChecklistItemRow";

export function ChecklistCard({
  checklist,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onReorder,
  onDuplicate,
  onDelete,
}) {
  const [draft, setDraft] = useState("");
  const dragFrom = useRef(null);
  const dragTo = useRef(null);

  function handleDrop() {
    const from = dragFrom.current;
    const to = dragTo.current;

    if (from === null || to === null || from === to) return;

    const ordered = [...checklist.items];
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);

    dragFrom.current = null;
    dragTo.current = null;
    onReorder(
      checklist,
      ordered.map((item) => item.id),
    );
  }

  async function submitItem(event) {
    event.preventDefault();
    if (!draft.trim()) return;

    await onAddItem(checklist, draft.trim());
    setDraft("");
  }

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-stone-50">{checklist.name}</h3>
          <p className="mt-1 text-xs text-stone-400">
            {checklist.completed_items_count ?? 0} de {checklist.items_count ?? 0} completados
          </p>
        </div>
        <Badge variant={checklist.progress === 100 ? "green" : "neutral"}>
          {labelFor(checklistTypes, checklist.type)}
        </Badge>
      </div>

      <div className="mt-4">
        <ProgressBar value={checklist.progress} />
      </div>

      <ul className="mt-4 space-y-0.5">
        {checklist.items.map((item, index) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            index={index}
            onToggle={onToggleItem}
            onRemove={onRemoveItem}
            onDragStart={(value) => (dragFrom.current = value)}
            onDragOver={(value) => (dragTo.current = value)}
            onDrop={handleDrop}
          />
        ))}
      </ul>

      <form className="mt-4 flex gap-2" onSubmit={submitItem}>
        <Input
          value={draft}
          placeholder="Anadir elemento"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button variant="secondary" type="submit">
          Anadir
        </Button>
      </form>

      <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-4">
        <Button variant="ghost" onClick={() => onDuplicate(checklist)}>
          Duplicar
        </Button>
        <Button variant="ghost" onClick={() => onDelete(checklist)}>
          Eliminar
        </Button>
      </div>
    </Panel>
  );
}
