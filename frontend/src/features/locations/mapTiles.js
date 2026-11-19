const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Failed tiles (with none loaded) before the map shows its fallback notice. */
export const TILE_ERROR_THRESHOLD = 4;

/**
 * Tile provider settings from VITE_MAP_* variables, OpenStreetMap by default.
 * `{key}` in the URL template is replaced by VITE_MAP_TILE_KEY.
 */
export function getTileConfig(env = import.meta.env) {
  const template = (env.VITE_MAP_TILE_URL || "").trim();
  const custom = template !== "";
  const key = (env.VITE_MAP_TILE_KEY || "").trim();

  return {
    url: custom ? template.replace("{key}", encodeURIComponent(key)) : OSM_URL,
    attribution: (env.VITE_MAP_TILE_ATTRIBUTION || "").trim() || (custom ? "" : OSM_ATTRIBUTION),
    // The dark look is a CSS filter over light tiles; providers with a native dark style opt out.
    darkFilter: String(env.VITE_MAP_TILE_DARK_FILTER ?? "true") !== "false",
    maxZoom: Number(env.VITE_MAP_TILE_MAX_ZOOM) || 19,
    subdomains: (env.VITE_MAP_TILE_SUBDOMAINS || "abc").trim(),
  };
}

/** True when tiles keep failing and none has ever loaded. */
export function tilesUnavailable({ errors, loaded }) {
  return loaded === 0 && errors >= TILE_ERROR_THRESHOLD;
}
