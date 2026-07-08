export function ExifPanel({ exif }) {
  const rows = [
    ["ISO", exif?.iso],
    ["Apertura", exif?.aperture ? `f/${exif.aperture}` : null],
    ["Objetivo", exif?.lens],
    ["Modelo", exif?.camera_model],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-md bg-white/[0.04] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{label}</p>
          <p className="mt-1 text-sm text-stone-200">{value || "No disponible"}</p>
        </div>
      ))}
    </div>
  );
}
