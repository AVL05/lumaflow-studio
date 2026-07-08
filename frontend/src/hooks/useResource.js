import { useCallback, useEffect, useState } from "react";
import { getApiError } from "../api/client";

/**
 * Carga un recurso no paginado (objeto o coleccion) con estados de
 * loading/error y refresco manual. Complementa usePaginatedResource.
 */
export function useResource(fetcher, { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await fetcher());
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (immediate) refresh();
  }, [immediate, refresh]);

  return { data, setData, loading, error, refresh };
}
