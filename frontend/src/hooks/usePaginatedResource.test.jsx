import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePaginatedResource } from "./usePaginatedResource";

function page(items, overrides = {}) {
  return { data: items, meta: { current_page: 1, last_page: 3, ...overrides } };
}

describe("usePaginatedResource", () => {
  it("carga los items y la meta al montar", async () => {
    const fetcher = vi.fn().mockResolvedValue(page([{ id: 1 }]));
    const { result } = renderHook(() => usePaginatedResource(fetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([{ id: 1 }]);
    expect(result.current.meta.last_page).toBe(3);
  });

  it("descarta los filtros vacios antes de llamar al fetcher", async () => {
    const fetcher = vi.fn().mockResolvedValue(page([]));
    renderHook(() => usePaginatedResource(fetcher, { search: "", status: "active", page: null }));

    await waitFor(() => expect(fetcher).toHaveBeenCalled());

    expect(fetcher).toHaveBeenCalledWith({ status: "active" });
  });

  it("vuelve a la primera pagina al cambiar un filtro", async () => {
    const fetcher = vi.fn().mockResolvedValue(page([]));
    const { result } = renderHook(() => usePaginatedResource(fetcher, { page: 4 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.updateFilter("status", "lead"));

    await waitFor(() => expect(fetcher).toHaveBeenLastCalledWith({ page: 1, status: "lead" }));
  });

  it("conserva la pagina cuando se navega explicitamente", async () => {
    const fetcher = vi.fn().mockResolvedValue(page([]));
    const { result } = renderHook(() => usePaginatedResource(fetcher, { page: 1 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(2));

    await waitFor(() => expect(fetcher).toHaveBeenLastCalledWith({ page: 2 }));
  });

  it("expone el mensaje de la API cuando el fetcher falla", async () => {
    const fetcher = vi.fn().mockRejectedValue({ response: { data: { message: "Sin permisos." } } });
    const { result } = renderHook(() => usePaginatedResource(fetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Sin permisos.");
    expect(result.current.items).toEqual([]);
  });
});
