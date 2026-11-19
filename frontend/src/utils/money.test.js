import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

// Intl separa el importe del símbolo con un espacio duro.
const normalize = (text) => text.replace(/\s/g, " ");

describe("formatMoney", () => {
  it("formatea importes de la API en euros", () => {
    expect(normalize(formatMoney("1754.50"))).toBe("1754,50 €");
    expect(normalize(formatMoney(12500))).toBe("12.500,00 €");
  });

  it("muestra cero cuando no hay importe ni texto alternativo", () => {
    expect(normalize(formatMoney(null))).toBe("0,00 €");
  });

  it("usa el texto alternativo cuando no hay importe", () => {
    expect(formatMoney(null, "Sin presupuesto")).toBe("Sin presupuesto");
    expect(normalize(formatMoney(0, "Sin presupuesto"))).toBe("0,00 €");
  });
});
