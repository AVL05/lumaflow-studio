import { useCallback, useMemo, useState } from "react";

/** Seleccion multiple para acciones masivas sobre listados. */
export function useSelection() {
  const [selected, setSelected] = useState([]);

  const toggle = useCallback((id) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  const toggleAll = useCallback((ids) => {
    setSelected((current) => (current.length === ids.length ? [] : ids));
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const isSelected = useCallback((id) => selected.includes(id), [selected]);

  return useMemo(
    () => ({ selected, count: selected.length, toggle, toggleAll, clear, isSelected }),
    [selected, toggle, toggleAll, clear, isSelected],
  );
}
