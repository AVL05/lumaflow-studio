import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../../api/auth", () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resendVerification: vi.fn(),
    completeOnboarding: vi.fn(),
    completeGettingStarted: vi.fn(),
  },
}));

import { authApi } from "../../api/auth";

function apiError(status) {
  const error = new Error(`Request failed with status code ${status}`);
  error.response = { status, headers: {} };
  return error;
}

let captured = null;

function Probe() {
  captured = useAuth();
  return <p>{`estado:${captured.authStatus}`}</p>;
}

function renderProvider() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("AuthProvider boot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    captured = null;
  });

  it("con token y 200 carga usuario y conserva token", async () => {
    localStorage.setItem("lumaflow_token", "valido");
    authApi.me.mockResolvedValue({ id: 3, email_verified: true });
    renderProvider();

    await waitFor(() => expect(screen.getByText("estado:authenticated")).toBeVisible());
    expect(captured.user).toEqual({ id: 3, email_verified: true });
    expect(localStorage.getItem("lumaflow_token")).toBe("valido");
  });

  it("con token y 401 limpia sesion y queda sin autenticar", async () => {
    localStorage.setItem("lumaflow_token", "muerto");
    authApi.me.mockRejectedValue(apiError(401));
    renderProvider();

    await waitFor(() => expect(screen.getByText("estado:unauthenticated")).toBeVisible());
    expect(localStorage.getItem("lumaflow_token")).toBeNull();
    expect(captured.user).toBeNull();
  });

  it.each([500, 503, 429])("con token y %i conserva sesion en degradado", async (status) => {
    localStorage.setItem("lumaflow_token", "valido");
    authApi.me.mockRejectedValue(apiError(status));
    renderProvider();

    await waitFor(() => expect(screen.getByText("estado:unavailable")).toBeVisible());
    expect(localStorage.getItem("lumaflow_token")).toBe("valido");
    expect(captured.bootError).toBeTruthy();
  });

  it("sin respuesta conserva sesion en degradado", async () => {
    localStorage.setItem("lumaflow_token", "valido");
    authApi.me.mockRejectedValue(new Error("Network Error"));
    renderProvider();

    await waitFor(() => expect(screen.getByText("estado:unavailable")).toBeVisible());
    expect(localStorage.getItem("lumaflow_token")).toBe("valido");
  });

  it("sin token queda sin autenticar sin llamar a la API", async () => {
    renderProvider();

    await waitFor(() => expect(screen.getByText("estado:unauthenticated")).toBeVisible());
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it("retry tras 500 recupera con 200 sin pedir credenciales", async () => {
    localStorage.setItem("lumaflow_token", "valido");
    authApi.me.mockRejectedValueOnce(apiError(500));
    renderProvider();

    await waitFor(() => expect(screen.getByText("estado:unavailable")).toBeVisible());

    authApi.me.mockResolvedValueOnce({ id: 9, email_verified: true });
    let recovered = null;
    await act(async () => {
      recovered = await captured.retryBoot();
    });

    expect(recovered).toEqual({ id: 9, email_verified: true });
    expect(localStorage.getItem("lumaflow_token")).toBe("valido");
    expect(screen.getByText("estado:authenticated")).toBeVisible();
  });

  it("retry tras 500 con 401 limpia y va a login", async () => {
    localStorage.setItem("lumaflow_token", "valido");
    authApi.me.mockRejectedValueOnce(apiError(500));
    renderProvider();

    await waitFor(() => expect(screen.getByText("estado:unavailable")).toBeVisible());

    authApi.me.mockRejectedValueOnce(apiError(401));
    await act(async () => {
      await captured.retryBoot();
    });

    expect(localStorage.getItem("lumaflow_token")).toBeNull();
    expect(screen.getByText("estado:unauthenticated")).toBeVisible();
  });

  it("refreshUser conserva ante 500 e invalida ante 401", async () => {
    localStorage.setItem("lumaflow_token", "valido");
    authApi.me.mockResolvedValue({ id: 5, email_verified: true });
    renderProvider();

    await waitFor(() => expect(screen.getByText("estado:authenticated")).toBeVisible());

    authApi.me.mockRejectedValueOnce(apiError(500));
    let caught = null;
    await act(async () => {
      try {
        await captured.refreshUser();
      } catch (error) {
        caught = error;
      }
    });
    expect(caught).not.toBeNull();
    expect(localStorage.getItem("lumaflow_token")).toBe("valido");
    expect(screen.getByText("estado:unavailable")).toBeVisible();

    authApi.me.mockRejectedValueOnce(apiError(401));
    await act(async () => {
      try {
        await captured.refreshUser();
      } catch {
        // 401 esperado: la sesion se invalida.
      }
    });
    expect(localStorage.getItem("lumaflow_token")).toBeNull();
    expect(screen.getByText("estado:unauthenticated")).toBeVisible();
  });
});
