import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchApi } from "../../api/search";
import { getApiError } from "../../api/client";
import { Input } from "../../components/ui/Input";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/states/ErrorState";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useHotkey } from "../../hooks/useHotkey";
import { SearchResultGroup } from "./SearchResultGroup";

/** Buscador unificado con atajo Ctrl/Cmd + K y navegacion por teclado. */
export function GlobalSearch({ open, onOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [term, setTerm] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState(0);

  const debounced = useDebouncedValue(term, 220);

  useHotkey("mod+k", () => (open ? onClose() : onOpen()), { allowInInput: true });
  useHotkey("escape", onClose, { allowInInput: true, enabled: open });

  const flat = useMemo(
    () => result?.groups.flatMap((group) => group.items) ?? [],
    [result],
  );

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setTerm("");
      setResult(null);
      setError("");
      setCursor(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || debounced.trim().length < 2) {
      setResult(null);

      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    searchApi
      .query(debounced.trim(), { signal: controller.signal })
      .then((data) => {
        setResult(data);
        setCursor(0);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(getApiError(err, "No se pudo completar la busqueda."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced, open]);

  function go(item) {
    onClose();
    navigate(item.url);
  }

  function handleKeyDown(event) {
    if (flat.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((current) => (current + 1) % flat.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((current) => (current - 1 + flat.length) % flat.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      go(flat[cursor]);
    }
  }

  if (!open) return null;

  const activeId = flat[cursor] ? `${flat[cursor].group}-${flat[cursor].id}` : null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 px-4 pt-24 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Busqueda global"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-white/10 bg-[#12110f] shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/10 p-3">
          <Input
            ref={inputRef}
            value={term}
            placeholder="Buscar sesiones, clientes, fotos, tareas..."
            aria-label="Buscar"
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {error ? <ErrorState message={error} /> : null}

          {loading ? (
            <div className="px-2 py-4">
              <LoadingSpinner label="Buscando..." />
            </div>
          ) : null}

          {!loading && term.trim().length < 2 ? (
            <p className="px-2 py-6 text-center text-sm text-stone-600">
              Escribe al menos dos caracteres. Usa las flechas y Enter para navegar.
            </p>
          ) : null}

          {!loading && result && result.total === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-stone-600">
              Sin resultados para &ldquo;{result.term}&rdquo;.
            </p>
          ) : null}

          {!loading && result
            ? result.groups.map((group) => (
                <SearchResultGroup
                  key={group.group}
                  group={group}
                  activeId={activeId}
                  onSelect={go}
                />
              ))
            : null}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[11px] text-stone-600">
          <span>Ctrl/Cmd + K para abrir o cerrar</span>
          <span>{result?.total ?? 0} resultados</span>
        </div>
      </div>
    </div>
  );
}
