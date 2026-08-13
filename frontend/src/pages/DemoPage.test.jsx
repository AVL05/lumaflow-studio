import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DemoPage } from "./DemoPage";

describe("DemoPage", () => {
  it("permite explorar datos ficticios sin autenticacion", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DemoPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Tu estudio, hoy" })).toBeInTheDocument();
    expect(
      screen.getByText(/Todos los nombres, importes y trabajos son ficticios/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Agenda" }));
    expect(screen.getByRole("heading", { name: "Agenda de la semana" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clientes" }));
    await user.click(screen.getByRole("button", { name: /Atelier Norte/ }));
    expect(screen.getByRole("heading", { name: "Atelier Norte" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Entrega" }));
    expect(screen.getByText("2 favoritas")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Añadir CM-027.jpg de favoritas" }));
    expect(screen.getByText("3 favoritas")).toBeInTheDocument();
  });
});
