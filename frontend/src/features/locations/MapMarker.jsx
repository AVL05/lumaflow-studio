export function buildMarkerIcon(leaflet, active = false) {
  return leaflet.divIcon({
    className: "",
    html: `<span class="${active ? "bg-amber-200" : "bg-stone-100"} block h-4 w-4 rounded-full border-2 border-stone-950 shadow-[0_0_24px_rgba(251,191,36,0.45)]"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}
