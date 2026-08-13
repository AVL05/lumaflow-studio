import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";

const authState = { user: null, booting: false, isAuthenticated: false };

vi.mock("./AuthContext", () => ({
  useAuth: () => authState,
}));

function renderRoute() {
  render(
    <MemoryRouter initialEntries={["/app/dashboard"]}>
      <Routes>
        <Route path="/login" element={<p>pantalla de login</p>} />
        <Route path="/verify-email" element={<p>verifica email</p>} />
        <Route path="/onboarding" element={<p>completa onboarding</p>} />
        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute>
              <p>contenido privado</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("redirige a login sin sesion", () => {
    Object.assign(authState, { booting: false, isAuthenticated: false });
    renderRoute();

    expect(screen.getByText("pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
  });

  it("no redirige mientras se comprueba el token", () => {
    Object.assign(authState, { booting: true, isAuthenticated: false });
    renderRoute();

    expect(screen.queryByText("pantalla de login")).not.toBeInTheDocument();
  });

  it("renderiza el contenido con sesion activa", () => {
    Object.assign(authState, {
      booting: false,
      isAuthenticated: true,
      user: {
        id: 1,
        email_verified: true,
        onboarding_completed: true,
        getting_started_completed: true,
      },
    });
    renderRoute();

    expect(screen.getByText("contenido privado")).toBeInTheDocument();
  });

  it("redirige a verificación con email pendiente", () => {
    Object.assign(authState, {
      booting: false,
      isAuthenticated: true,
      user: { id: 1, email_verified: false, onboarding_completed: false },
    });
    renderRoute();

    expect(screen.getByText("verifica email")).toBeInTheDocument();
  });

  it("redirige al onboarding después de verificar", () => {
    Object.assign(authState, {
      booting: false,
      isAuthenticated: true,
      user: { id: 1, email_verified: true, onboarding_completed: false },
    });
    renderRoute();

    expect(screen.getByText("completa onboarding")).toBeInTheDocument();
  });
});
