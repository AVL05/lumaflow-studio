export function SearchResultGroup({ group, activeId, onSelect }) {
  return (
    <div>
      <p className="px-2 py-1.5 text-xs uppercase tracking-[0.18em] text-stone-400">
        {group.label}
      </p>
      <ul>
        {group.items.map((item) => {
          const id = `${item.group}-${item.id}`;

          return (
            <li key={id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(item)}
                className={`flex w-full items-baseline gap-3 rounded-md px-2 py-2 text-left transition ${
                  id === activeId ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
                }`}
              >
                <span className="truncate text-sm text-stone-100">{item.title}</span>
                {item.subtitle ? (
                  <span className="truncate text-xs text-stone-400">{item.subtitle}</span>
                ) : null}
                {item.meta ? (
                  <span className="ml-auto shrink-0 text-xs text-stone-400">{item.meta}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
