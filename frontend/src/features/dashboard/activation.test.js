import { describe, expect, it } from "vitest";
import { getNextAction, isActivationComplete } from "./activation";

function activationFor(completedKeys) {
  const all = [
    ["studio", "Configura tu estudio", "/onboarding"],
    ["client", "Añade tu primer cliente", "/app/clients"],
    ["job", "Crea tu primer trabajo", "/app/jobs"],
    ["bookings", "Activa tus reservas", "/app/booking-requests"],
    ["session", "Crea tu primera sesión", "/app/sessions"],
  ];

  return {
    completed: completedKeys.length,
    total: all.length,
    steps: all.map(([key, label, href]) => ({
      key,
      label,
      href,
      completed: completedKeys.includes(key),
    })),
  };
}

describe("getNextAction", () => {
  it("pide el primer cliente cuando no hay nada", () => {
    expect(getNextAction(activationFor(["studio"]))).toEqual({
      key: "client",
      label: "Añade tu primer cliente",
      href: "/app/clients",
    });
  });

  it("avanza en orden cliente, trabajo y sesion", () => {
    expect(getNextAction(activationFor(["studio", "client"]))?.key).toBe("job");
    expect(getNextAction(activationFor(["studio", "client", "job"]))?.key).toBe("session");
  });

  it("propone activar reservas tras el flujo inicial", () => {
    expect(getNextAction(activationFor(["studio", "client", "job", "session"]))?.key).toBe(
      "bookings",
    );
  });

  it("no propone nada cuando todo esta completo", () => {
    expect(
      getNextAction(activationFor(["studio", "client", "job", "bookings", "session"])),
    ).toBeNull();
  });

  it("tolera una respuesta ausente o parcial", () => {
    expect(getNextAction(null)).toBeNull();
    expect(getNextAction({})).toBeNull();
  });
});

describe("isActivationComplete", () => {
  it("detecta el checklist completo e incompleto", () => {
    expect(
      isActivationComplete(activationFor(["studio", "client", "job", "bookings", "session"])),
    ).toBe(true);
    expect(isActivationComplete(activationFor(["studio"]))).toBe(false);
    expect(isActivationComplete(null)).toBe(false);
  });
});
