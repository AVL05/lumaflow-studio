import { useEffect, useRef } from "react";

const editableTags = ["INPUT", "TEXTAREA", "SELECT"];

/**
 * Registra un atajo global. `combo` admite "mod+k", "shift+n" o "escape".
 * Ignora pulsaciones dentro de campos editables salvo que allowInInput sea true.
 */
export function useHotkey(combo, handler, { allowInInput = false, enabled = true } = {}) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return undefined;

    const parts = combo.toLowerCase().split("+");
    const key = parts.at(-1);
    const needsMod = parts.includes("mod");
    const needsShift = parts.includes("shift");

    function onKeyDown(event) {
      const target = event.target;
      const inEditable = editableTags.includes(target?.tagName) || target?.isContentEditable;

      if (inEditable && !allowInInput) return;
      if (event.key?.toLowerCase() !== key) return;
      if (needsMod !== (event.metaKey || event.ctrlKey)) return;
      if (needsShift !== event.shiftKey) return;

      event.preventDefault();
      handlerRef.current(event);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, allowInInput, enabled]);
}
