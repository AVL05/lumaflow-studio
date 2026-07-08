import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiError } from "../api/client";

export function usePaginatedResource(fetcher, initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    return Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== "" && value !== null && value !== undefined,
      ),
    );
  }, [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetcher(params);
      setItems(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [fetcher, params]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, page: 1, [name]: value }));
  }

  function setPage(page) {
    setFilters((current) => ({ ...current, page }));
  }

  return {
    items,
    setItems,
    meta,
    loading,
    error,
    filters,
    setFilters,
    updateFilter,
    setPage,
    refresh,
  };
}
