import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function AlbumCard({ album, onEdit, onDelete }) {
  return (
    <Card className="overflow-hidden">
      <div
        className="h-24 border-b border-white/10"
        style={{
          background: `linear-gradient(135deg, ${album.color}, #161411)`,
        }}
      />
      <div className="p-5">
        <h2 className="font-semibold">{album.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-stone-500">
          {album.description || "Sin descripcion."}
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-stone-500">
          {album.photos_count ?? 0} fotos
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" onClick={() => onEdit(album)}>
            Editar
          </Button>
          <Button variant="danger" onClick={() => onDelete(album)}>
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  );
}
