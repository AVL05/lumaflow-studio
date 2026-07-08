import { useEffect, useState } from "react";

const prefix = "lumaflow:";

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(prefix + key);

    if (raw === null) return fallback;

    const parsed = JSON.parse(raw);

    // Fusiona con el valor inicial para tolerar filtros nuevos entre versiones.
    return isPlainObject(fallback) && isPlainObject(parsed)
      ? { ...fallback, ...parsed }
      : parsed;
  } catch {
    return fallback;
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Estado persistido en localStorage. Se usa para conservar filtros y
 * preferencias de vista entre navegaciones y recargas.
 */
export function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => read(key, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(prefix + key, JSON.stringify(value));
    } catch {
      // Cuota agotada o modo privado: la persistencia es opcional.
    }
  }, [key, value]);

  return [value, setValue];
}
