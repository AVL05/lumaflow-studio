import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingPage } from "./OnboardingPage";

const authState = {
  user: {
    id: 1,
    email_verified: true,
    onboarding_completed: false,
    photography_specialties: [],
  },
  booting: false,
  isAuthenticated: true,
  completeOnboarding: vi.fn(),
};

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => authState,
}));

describe("OnboardingPage", () => {
  beforeEach(() => {
    authState.completeOnboarding.mockReset();
    authState.completeOnboarding.mockResolvedValue({ onboarding_completed: true });
  });

  it("recoge estudio, especialidad, país, moneda y primera prioridad", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Nombre del estudio"), "Norte Estudio");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Bodas" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByLabelText("País")).toHaveValue("ES");
    expect(screen.getByLabelText("Moneda")).toHaveValue("EUR");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: /Organizar mis próximas sesiones/i }));
    await user.click(screen.getByRole("button", { name: "Abrir mi estudio" }));

    expect(authState.completeOnboarding).toHaveBeenCalledWith({
      studio_name: "Norte Estudio",
      photography_specialties: ["wedding"],
      country: "ES",
      currency: "EUR",
      onboarding_goal: "organize_sessions",
    });
  });
});
