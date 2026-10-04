import { describe, expect, it } from "vitest";
import { allowedTransitions, canDeleteContract, canEditContract } from "./contractTransitions";

describe("contractTransitions", () => {
  it("solo permite enviar desde borrador", () => {
    expect(allowedTransitions("draft")).toEqual(["sent"]);
    expect(canEditContract("draft")).toBe(true);
    expect(canDeleteContract("draft")).toBe(true);
  });

  it("bloquea edicion y borrado tras enviar", () => {
    expect(canEditContract("sent")).toBe(false);
    expect(canDeleteContract("sent")).toBe(false);
    expect(allowedTransitions("sent")).toEqual(["accepted", "rejected", "expired"]);
  });

  it("deja los terminales sin salidas", () => {
    for (const status of ["accepted", "rejected", "expired"]) {
      expect(allowedTransitions(status)).toEqual([]);
      expect(canEditContract(status)).toBe(false);
    }
    expect(allowedTransitions("otro")).toEqual([]);
  });
});
