import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { accessDifficulties, labelFor, locationTypes } from "../../utils/catalogs";
import { LocationMapPreview } from "./LocationMapPreview";

export function LocationCard({ location, onEdit, onDelete }) {
  return (
    <Card className="overflow-hidden">
      <LocationMapPreview
        latitude={location.latitude}
        longitude={location.longitude}
        name={location.name}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">{location.name}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {[location.city, location.country].filter(Boolean).join(", ") || "Sin ciudad"}
            </p>
          </div>
          <Badge variant="warm">{labelFor(locationTypes, location.type)}</Badge>
        </div>
        <p className="mt-4 text-sm text-stone-400">
          {location.best_time || "Sin mejor hora"} ·{" "}
          {labelFor(accessDifficulties, location.access_difficulty)}
        </p>
        <p className="mt-2 text-sm text-stone-500">
          {location.rating ? `Rating ${location.rating}/5` : "Sin valorar"} ·{" "}
          {location.sessions_count ?? 0} sesiones
        </p>
        <div className="mt-4 flex flex-wrap gap-1">
          {location.is_favorite ? <Badge variant="warm">Favorita</Badge> : null}
          {location.tags.slice(0, 3).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={`/app/locations/${location.id}`}>
            <Button variant="secondary">Detalle</Button>
          </Link>
          <Button variant="secondary" onClick={() => onEdit(location)}>
            Editar
          </Button>
          <Button variant="danger" onClick={() => onDelete(location)}>
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  );
}
