import { Badge } from "../../components/ui/Badge";
import { accessDifficulties, labelFor, locationTypes } from "../../utils/catalogs";

export function LocationHeader({ location }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-start">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{location.name}</h1>
          {location.is_favorite ? <Badge variant="warm">Favorita</Badge> : null}
        </div>
        <p className="mt-2 text-sm text-stone-400">
          {[location.city, location.country].filter(Boolean).join(", ") || "Sin ciudad"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="warm">{labelFor(locationTypes, location.type)}</Badge>
        <Badge>{labelFor(accessDifficulties, location.access_difficulty)}</Badge>
      </div>
    </div>
  );
}
