import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

vi.mock("../../app/sentry", () => ({
  captureAppError: vi.fn(() => "ref-999"),
}));

function Exploding() {
  throw new Error("boom");
}

describe("AppErrorBoundary", () => {
  it("muestra caida controlada con referencia en lugar de pantalla en blanco", () => {
    render(
      <AppErrorBoundary>
        <Exploding />
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Algo se ha roto")).toBeVisible();
    expect(screen.getByText(/ref-999/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Recargar" })).toBeVisible();
  });

  it("renderiza hijos sanos sin intervenir", () => {
    render(
      <AppErrorBoundary>
        <p>Contenido ok</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Contenido ok")).toBeVisible();
  });
});
