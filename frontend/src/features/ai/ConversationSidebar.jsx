import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ConversationCard } from "./ConversationCard";

export function ConversationSidebar({
  conversations,
  activeId,
  search,
  onSearch,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onClear,
}) {
  return (
    <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Conversaciones</h2>
          <p className="mt-1 text-xs text-stone-400">Historial persistente</p>
        </div>
        <Button type="button" onClick={onNew}>
          Nueva
        </Button>
      </div>
      <Input
        className="mt-4"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Buscar"
      />
      <div className="mt-4 space-y-2">
        {conversations.length === 0 ? (
          <p className="text-sm text-stone-400">Sin conversaciones.</p>
        ) : (
          conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === activeId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
      {conversations.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-xs font-medium text-stone-500 underline decoration-white/20 underline-offset-4 hover:text-red-200"
        >
          Borrar historial de este estudio
        </button>
      ) : null}
    </aside>
  );
}
