import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { accessDifficulties, accessModes, labelFor, seasons } from "../../utils/catalogs";

export function LocationSidebar({ location, onCopy }) {
  const links = [
    ["Google Maps", location.google_maps_url],
    ["Apple Maps", location.apple_maps_url],
    ["OpenStreetMap", location.openstreetmap_url],
  ].filter(([, href]) => href);

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Planificacion</h2>
      <div className="mt-4 grid gap-3 text-sm text-stone-400">
        <p>
          <span className="text-stone-100">Mejor hora:</span> {location.best_time || "Sin dato"}
        </p>
        <p>
          <span className="text-stone-100">Dificultad:</span>{" "}
          {labelFor(accessDifficulties, location.access_difficulty)}
        </p>
        <p>
          <span className="text-stone-100">Acceso:</span>{" "}
          {labelFor(accessModes, location.access_mode) || "Sin dato"}
        </p>
        <p>
          <span className="text-stone-100">Coste:</span>{" "}
          {location.cost ? `${location.cost} EUR` : "Sin coste"}
        </p>
        <p>
          <span className="text-stone-100">Clima recomendado:</span>{" "}
          {location.recommended_weather || "Sin dato"}
        </p>
        <p>
          <span className="text-stone-100">Permisos:</span>{" "}
          {location.permissions_required || "Sin permisos registrados"}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(location.recommended_seasons || []).map((season) => (
          <Badge key={season}>{labelFor(seasons, season)}</Badge>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onCopy}>
          Copiar coordenadas
        </Button>
        {links.map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noreferrer">
            <Button variant="secondary">{label}</Button>
          </a>
        ))}
      </div>
    </Card>
  );
}
