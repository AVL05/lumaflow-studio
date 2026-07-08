export function ConversationCard({ conversation, active, onSelect, onRename, onDelete }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`w-full rounded-lg border p-3 text-left transition hover:border-amber-200/30 hover:bg-white/[0.05] ${active ? "border-amber-200/40 bg-amber-200/[0.06]" : "border-white/10 bg-white/[0.03]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-100">{conversation.title}</p>
          <p className="mt-1 text-xs text-stone-500">{conversation.messages_count ?? 0} mensajes</p>
        </div>
        <div className="flex gap-2 text-xs text-stone-500">
          <span
            onClick={(event) => {
              event.stopPropagation();
              onRename(conversation);
            }}
          >
            Editar
          </span>
          <span
            onClick={(event) => {
              event.stopPropagation();
              onDelete(conversation);
            }}
          >
            Borrar
          </span>
        </div>
      </div>
    </button>
  );
}
