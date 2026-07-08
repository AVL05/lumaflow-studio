import { Button } from "../../components/ui/Button";

export function GalleryViewSwitcher({ value, onChange }) {
  return (
    <div className="flex rounded-md border border-white/10 bg-white/[0.04] p-1">
      {["grid", "list"].map((view) => (
        <Button
          key={view}
          variant={value === view ? "primary" : "ghost"}
          className="px-3 py-1.5"
          onClick={() => onChange(view)}
        >
          {view === "grid" ? "Grid" : "Lista"}
        </Button>
      ))}
    </div>
  );
}
