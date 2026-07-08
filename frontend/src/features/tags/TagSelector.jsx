import { Badge } from "../../components/ui/Badge";

export function TagSelector({ tags, selected, onChange }) {
  function toggle(id) {
    const next = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => toggle(tag.id)}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-amber-200/40"
        >
          <Badge variant={selected.includes(tag.id) ? "warm" : "neutral"}>
            {tag.name}
          </Badge>
        </button>
      ))}
    </div>
  );
}
