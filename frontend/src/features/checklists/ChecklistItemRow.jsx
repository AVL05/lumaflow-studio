import { Checkbox } from "../../components/ui/Checkbox";

/** Fila reordenable por drag & drop nativo dentro de una checklist. */
export function ChecklistItemRow({ item, index, onToggle, onRemove, onDragStart, onDragOver, onDrop }) {
  return (
    <li
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(index);
      }}
      onDrop={onDrop}
      className="group flex cursor-grab items-center gap-3 rounded-md border border-transparent px-2 py-1.5 transition hover:border-white/[0.08] hover:bg-white/[0.03] active:cursor-grabbing"
    >
      <span aria-hidden className="text-xs text-stone-700 group-hover:text-stone-500">
        ::
      </span>
      <Checkbox
        checked={item.is_completed}
        onChange={() => onToggle(item)}
        aria-label={item.title}
      />
      <span
        className={`flex-1 text-sm ${item.is_completed ? "text-stone-600 line-through" : "text-stone-200"}`}
      >
        {item.title}
      </span>
      <button
        type="button"
        onClick={() => onRemove(item)}
        aria-label={`Eliminar ${item.title}`}
        className="rounded px-2 text-xs text-stone-600 opacity-0 transition hover:text-red-300 group-hover:opacity-100"
      >
        Quitar
      </button>
    </li>
  );
}
