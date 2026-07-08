import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { accessDifficulties, labelFor, locationTypes } from "../../utils/catalogs";
import { LocationGallery } from "./LocationGallery";
import { LocationHeader } from "./LocationHeader";
import { LocationMap } from "./LocationMap";
import { LocationSidebar } from "./LocationSidebar";
import { LocationStats } from "./LocationStats";

export function LocationDetail({ location, onCopy }) {
  return (
    <div className="space-y-6">
      <LocationHeader location={location} />
      <LocationStats location={location} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <LocationMap location={location} />
          <Card className="p-5">
            <h2 className="font-semibold">Notas y datos tecnicos</h2>
            <div className="mt-6 grid gap-4 text-sm text-stone-400 md:grid-cols-2">
              <p>
                <span className="text-stone-100">Tipo:</span>{" "}
                {labelFor(locationTypes, location.type)}
              </p>
              <p>
                <span className="text-stone-100">Dificultad:</span>{" "}
                {labelFor(accessDifficulties, location.access_difficulty)}
              </p>
              <p>
                <span className="text-stone-100">Latitud:</span> {location.latitude}
              </p>
              <p>
                <span className="text-stone-100">Longitud:</span> {location.longitude}
              </p>
            </div>
            <p className="mt-6 text-sm leading-6 text-stone-400">
              {location.notes || "Sin notas."}
            </p>
            <TagBlock title="Tags" items={location.tags} />
            <TagBlock title="Equipo recomendado" items={location.recommended_gear} />
          </Card>
          <LocationGallery photos={location.photos} coverPhoto={location.cover_photo} />
        </div>
        <div className="space-y-6">
          <LocationSidebar location={location} onCopy={onCopy} />
          <Card className="p-5">
            <h2 className="font-semibold">Sesiones realizadas alli</h2>
            <div className="mt-4 space-y-3">
              {location.sessions?.length ? (
                location.sessions.map((session) => (
                  <div key={session.id} className="rounded-md bg-white/[0.04] p-3">
                    <p className="text-sm text-stone-100">{session.name}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {session.date} · {session.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500">Sin sesiones asociadas todavia.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TagBlock({ title, items }) {
  if (!items?.length) return null;

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-stone-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}
