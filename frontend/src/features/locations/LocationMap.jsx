import { MapView } from "./MapView";

export function LocationMap({ location, selectable = false, onSelect }) {
  return (
    <MapView
      selected={location}
      selectable={selectable}
      onSelect={onSelect}
      height="h-96"
      zoom={15}
    />
  );
}
