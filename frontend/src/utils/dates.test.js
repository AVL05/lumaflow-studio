import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./dates";

describe("formatDate", () => {
  it("muestra fechas de la API con mes abreviado en español", () => {
    expect(formatDate("2026-11-19")).toBe("19 nov 2026");
  });

  it("no desplaza el día por la zona horaria", () => {
    expect(formatDate("2026-01-01")).toBe("1 ene 2026");
  });

  it("acepta fechas con hora", () => {
    expect(formatDate("2026-03-05T10:30:00")).toBe("5 mar 2026");
  });

  it("usa el texto alternativo cuando no hay fecha", () => {
    expect(formatDate(null)).toBe("Sin fecha");
    expect(formatDate("", "—")).toBe("—");
  });

  it("devuelve el valor original si no es una fecha", () => {
    expect(formatDate("pendiente")).toBe("pendiente");
  });
});

describe("formatDateTime", () => {
  it("muestra fecha y hora sin segundos", () => {
    expect(formatDateTime("2026-10-18T12:11:33")).toBe("18 oct 2026, 12:11");
  });

  it("devuelve el texto alternativo sin valor", () => {
    expect(formatDateTime(null)).toBe("");
  });
});
