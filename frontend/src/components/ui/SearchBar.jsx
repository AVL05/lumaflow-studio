import { Input } from "./Input";

export function SearchBar({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <Input
      aria-label={placeholder}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
