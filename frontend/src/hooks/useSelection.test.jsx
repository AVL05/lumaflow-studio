import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSelection } from "./useSelection";

describe("useSelection", () => {
  it("empieza vacia", () => {
    const { result } = renderHook(() => useSelection());

    expect(result.current.selected).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("alterna elementos individuales", () => {
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggle(1));
    act(() => result.current.toggle(2));
    expect(result.current.selected).toEqual([1, 2]);
    expect(result.current.isSelected(1)).toBe(true);

    act(() => result.current.toggle(1));
    expect(result.current.selected).toEqual([2]);
    expect(result.current.isSelected(1)).toBe(false);
  });

  it("toggleAll selecciona todo y vuelve a vaciar cuando ya estaba completo", () => {
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleAll([1, 2, 3]));
    expect(result.current.count).toBe(3);

    act(() => result.current.toggleAll([1, 2, 3]));
    expect(result.current.count).toBe(0);
  });

  it("clear vacia la seleccion", () => {
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggleAll([4, 5]));
    act(() => result.current.clear());

    expect(result.current.selected).toEqual([]);
  });
});
