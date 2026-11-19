import { describe, expect, it } from "vitest";
import { getTileConfig, tilesUnavailable, TILE_ERROR_THRESHOLD } from "./mapTiles";

describe("getTileConfig", () => {
  it("defaults to OpenStreetMap with attribution and the dark filter", () => {
    const config = getTileConfig({});

    expect(config.url).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(config.attribution).toContain("OpenStreetMap");
    expect(config.darkFilter).toBe(true);
    expect(config.maxZoom).toBe(19);
  });

  it("switches provider with environment variables only", () => {
    const config = getTileConfig({
      VITE_MAP_TILE_URL: "https://tiles.example.com/{z}/{x}/{y}.png?key={key}",
      VITE_MAP_TILE_KEY: "a b",
      VITE_MAP_TILE_ATTRIBUTION: "Example Maps",
      VITE_MAP_TILE_DARK_FILTER: "false",
      VITE_MAP_TILE_MAX_ZOOM: "18",
    });

    expect(config.url).toBe("https://tiles.example.com/{z}/{x}/{y}.png?key=a%20b");
    expect(config.attribution).toBe("Example Maps");
    expect(config.darkFilter).toBe(false);
    expect(config.maxZoom).toBe(18);
  });

  it("does not claim OpenStreetMap attribution for a custom provider without one", () => {
    expect(
      getTileConfig({ VITE_MAP_TILE_URL: "https://t.example/{z}/{x}/{y}.png" }).attribution,
    ).toBe("");
  });
});

describe("tilesUnavailable", () => {
  it("only trips when no tile loaded and errors reach the threshold", () => {
    expect(tilesUnavailable({ errors: TILE_ERROR_THRESHOLD, loaded: 0 })).toBe(true);
    expect(tilesUnavailable({ errors: TILE_ERROR_THRESHOLD - 1, loaded: 0 })).toBe(false);
    expect(tilesUnavailable({ errors: 50, loaded: 1 })).toBe(false);
  });
});
