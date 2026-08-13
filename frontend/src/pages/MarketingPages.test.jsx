import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FeaturesPage } from "./FeaturesPage";
import { PricingPage } from "./PricingPage";
import { PrivacyPage } from "./PrivacyPage";

function renderPage(page) {
  render(<MemoryRouter>{page}</MemoryRouter>);
}

describe("páginas comerciales", () => {
  it("presenta funcionalidades como casos de uso", () => {
    renderPage(<FeaturesPage />);

    expect(
      screen.getByRole("heading", { name: "Convierte solicitudes en sesiones" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Controla tus entregas" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cobra sin perseguir clientes" }),
    ).toBeInTheDocument();
  });

  it("explica el coste y evita cargos implícitos", () => {
    renderPage(<PricingPage />);

    expect(screen.getByText("0 €")).toBeInTheDocument();
    expect(screen.getByText("Sin tarjeta. Sin cargos automáticos.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Qué ocurrirá después." })).toBeInTheDocument();
  });

  it("separa IA local, API y almacenamiento de galerías", () => {
    renderPage(<PrivacyPage />);

    expect(screen.getByRole("heading", { name: "Tu navegador" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "API de LumaFlow" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Almacenamiento de galerías" })).toBeInTheDocument();
    expect(screen.getByText(/no envía el prompt a OpenAI/i)).toBeInTheDocument();
  });
});
