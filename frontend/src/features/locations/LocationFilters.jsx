import { Input } from "../../components/ui/Input";
import { SearchBar } from "../../components/ui/SearchBar";
import { Select } from "../../components/ui/Select";
import { accessDifficulties, accessModes, locationTypes } from "../../utils/catalogs";

export function LocationFilters({ resource }) {
  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_140px_140px_140px_140px_120px_130px]">
      <SearchBar
        value={resource.filters.search ?? ""}
        onChange={(value) => resource.updateFilter("search", value)}
        placeholder="Buscar localizaciones"
      />
      <Input
        value={resource.filters.city ?? ""}
        onChange={(event) => resource.updateFilter("city", event.target.value)}
        placeholder="Ciudad"
      />
      <Select
        value={resource.filters.type ?? ""}
        onChange={(event) => resource.updateFilter("type", event.target.value)}
        options={[{ value: "", label: "Todos los tipos" }, ...locationTypes]}
      />
      <Select
        value={resource.filters.access_difficulty ?? ""}
        onChange={(event) => resource.updateFilter("access_difficulty", event.target.value)}
        options={[{ value: "", label: "Dificultad" }, ...accessDifficulties]}
      />
      <Select
        value={resource.filters.access_mode ?? ""}
        onChange={(event) => resource.updateFilter("access_mode", event.target.value)}
        options={[{ value: "", label: "Acceso" }, ...accessModes]}
      />
      <Select
        value={resource.filters.favorite ?? ""}
        onChange={(event) => resource.updateFilter("favorite", event.target.value)}
        options={[
          { value: "", label: "Todas" },
          { value: "1", label: "Favoritas" },
        ]}
      />
      <Select
        value={resource.filters.sort ?? "created_at"}
        onChange={(event) => resource.updateFilter("sort", event.target.value)}
        options={[
          { value: "created_at", label: "Reciente" },
          { value: "name", label: "Nombre" },
          { value: "city", label: "Ciudad" },
          { value: "type", label: "Tipo" },
          { value: "rating", label: "Rating" },
        ]}
      />
    </div>
  );
}
