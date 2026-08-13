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

const commands = [
  ["Crear cliente", "/app/clients?create=1", "Nuevo contacto"],
  ["Crear trabajo", "/app/jobs?create=1", "Nuevo proyecto"],
  ["Crear sesión", "/app/sessions?create=1", "Producción"],
  ["Crear presupuesto", "/app/quotes?create=1", "Negocio"],
  ["Crear factura", "/app/invoices?create=1", "Negocio"],
  ["Crear tarea", "/app/tasks?create=1", "Herramientas"],
  ["Ir a inicio", "/app/dashboard", "Navegación"],
  ["Ir a calendario", "/app/calendar", "Navegación"],
  ["Ir a analítica", "/app/analytics", "Navegación"],
  ["Abrir configuración", "/app/settings", "Navegación"],
  ["Abrir estado avanzado", "/app/settings/advanced", "Configuración"],
  ["Preguntar a Luma", null, "Asistente global", "luma"],
].map(([title, url, subtitle, action], id) => ({ id, group: "commands", title, url, subtitle, action }));

/** Buscador unificado con atajo Ctrl/Cmd + K y navegacion por teclado. */
export function GlobalSearch({ open, onOpen, onClose, onOpenLuma }) {
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

  const commandGroup = useMemo(() => {
    const query = term.trim().toLocaleLowerCase("es");
    const items = commands.filter((item) => !query || `${item.title} ${item.subtitle}`.toLocaleLowerCase("es").includes(query));
    return { group: "commands", label: "Acciones", items };
  }, [term]);
  const flat = useMemo(
    () => commandGroup.items.concat(result?.groups.flatMap((group) => group.items) ?? []),
    [commandGroup, result],
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

  useEffect(() => setCursor(0), [term]);

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
    if (item.action === "luma") {
      onOpenLuma();
      return;
    }
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
            placeholder="Buscar o ejecutar un comando..."
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

          {commandGroup.items.length ? <SearchResultGroup group={commandGroup} activeId={activeId} onSelect={go} /> : null}

          {!loading && term.trim().length > 0 && term.trim().length < 2 ? <p className="px-2 py-3 text-xs text-stone-500">Escribe dos caracteres para buscar también en tus datos.</p> : null}

          {!loading && result && result.total === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-stone-400">
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

        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs text-stone-400">
          <span>Ctrl/Cmd + K para abrir o cerrar</span>
          <span>{flat.length} opciones</span>
        </div>
      </div>
    </div>
  );
}
