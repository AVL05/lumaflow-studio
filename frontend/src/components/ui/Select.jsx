import { inputClass } from "./Field";

export function Select({ options = [], ...props }) {
  return (
    <select className={inputClass} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
