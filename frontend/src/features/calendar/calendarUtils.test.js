import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  groupByDate,
  isSameMonth,
  monthGrid,
  rangeForView,
  startOfWeek,
  toIsoDate,
  weekGrid,
} from "./calendarUtils";

describe("toIsoDate", () => {
  it("usa la fecha local, sin desplazarla por zona horaria", () => {
    // Un new Date(...).toISOString() directo devolveria el dia anterior en UTC-x.
    expect(toIsoDate(new Date(2026, 6, 8, 0, 30))).toBe("2026-07-08");
    expect(toIsoDate(new Date(2026, 0, 1, 23, 59))).toBe("2026-01-01");
  });
});

describe("addDays", () => {
  it("cruza el cambio de mes y de anio", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("addMonths", () => {
  it("no desborda al pasar de un mes largo a uno corto", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-01");
    expect(addMonths("2026-03-15", -1)).toBe("2026-02-01");
  });
});

describe("startOfWeek", () => {
  it("ancla la semana en lunes", () => {
    expect(startOfWeek("2026-07-08")).toBe("2026-07-06");
    expect(startOfWeek("2026-07-06")).toBe("2026-07-06");
    expect(startOfWeek("2026-07-12")).toBe("2026-07-06");
  });
});

describe("monthGrid", () => {
  it("devuelve seis semanas completas que contienen el mes", () => {
    const grid = monthGrid("2026-07-08");

    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-06-29");
    expect(grid.at(-1)).toBe("2026-08-09");
    expect(grid).toContain("2026-07-01");
    expect(grid).toContain("2026-07-31");
  });
});

describe("weekGrid", () => {
  it("devuelve siete dias consecutivos desde el lunes", () => {
    expect(weekGrid("2026-07-08")).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
  });
});

describe("isSameMonth", () => {
  it("compara anio y mes, no solo el mes", () => {
    expect(isSameMonth("2026-07-31", "2026-07-01")).toBe(true);
    expect(isSameMonth("2025-07-31", "2026-07-01")).toBe(false);
  });
});

describe("rangeForView", () => {
  it("acota el rango consultado segun la vista", () => {
    expect(rangeForView("day", "2026-07-08")).toEqual({ from: "2026-07-08", to: "2026-07-08" });
    expect(rangeForView("week", "2026-07-08")).toEqual({ from: "2026-07-06", to: "2026-07-12" });
    expect(rangeForView("month", "2026-07-08")).toEqual({ from: "2026-06-29", to: "2026-08-09" });
    expect(rangeForView("agenda", "2026-07-08")).toEqual({ from: "2026-07-08", to: "2026-09-06" });
  });
});

describe("groupByDate", () => {
  it("agrupa eventos por dia conservando el orden de llegada", () => {
    const events = [
      { id: "session-1", date: "2026-07-08" },
      { id: "task-2", date: "2026-07-09" },
      { id: "task-3", date: "2026-07-08" },
    ];

    expect(groupByDate(events)).toEqual({
      "2026-07-08": [events[0], events[2]],
      "2026-07-09": [events[1]],
    });
  });

  it("devuelve un objeto vacio sin eventos", () => {
    expect(groupByDate([])).toEqual({});
  });
});
