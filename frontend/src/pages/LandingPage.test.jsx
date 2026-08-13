import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("presenta el producto y enlaza el acceso sin convertir el login en portada", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Tu estudio fotográfico, en un único lugar." }),
    ).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Entrar" })) {
      expect(link).toHaveAttribute("href", "/login");
    }
    expect(screen.getAllByRole("link", { name: "Empezar gratis" })[0]).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: "Explorar demo" })).toHaveAttribute("href", "/demo");
    expect(screen.getByRole("heading", { name: "Preguntas frecuentes" })).toBeInTheDocument();
    expect(screen.getAllByText(/no solicita tarjeta/i).length).toBeGreaterThan(0);
    expect(
      screen.getByAltText(
        "Dashboard real de LumaFlow Studio con calendario, tareas y métricas del estudio",
      ),
    ).toHaveAttribute("src", "/product/dashboard.png");
  });
});
