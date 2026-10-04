import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContractPortalPage } from "./ContractPortalPage";

vi.mock("../api/public", () => ({
  publicApi: {
    contract: vi.fn(),
    acceptContract: vi.fn(),
    rejectContract: vi.fn(),
  },
}));

import { publicApi } from "../api/public";

function renderPortal(token = "abc123") {
  return render(
    <MemoryRouter initialEntries={[`/contract/${token}`]}>
      <Routes>
        <Route path="/contract/:token" element={<ContractPortalPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const sentView = {
  data: {
    contract_number: "CON-2026-0001",
    title: "Contrato boda",
    content: "# Servicio\n\nCobertura.",
    status: "sent",
    version: 2,
    studio_name: "Estudio",
    client_name: "Novios",
    service: "Boda",
    sent_at: "2026-10-01T10:00:00.000000Z",
    expires_at: null,
    decided_at: null,
  },
};

describe("ContractPortalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el contrato con aceptar y rechazar", async () => {
    publicApi.contract.mockResolvedValue(sentView);

    renderPortal();

    await waitFor(() => expect(screen.getByText("Contrato boda")).toBeVisible());
    expect(screen.getByText(/# Servicio/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Aceptar contrato" })).toBeEnabled();
    expect(screen.getByText(/No constituye una firma electrónica certificada/)).toBeVisible();
  });

  it("muestra estado no disponible con enlace desconocido", async () => {
    publicApi.contract.mockRejectedValue(new Error("Nope"));

    renderPortal();

    await waitFor(() => expect(screen.getByText(/ya no está disponible/)).toBeVisible());
  });

  it("acepta una sola vez aunque se pulse dos veces", async () => {
    publicApi.contract.mockResolvedValue(sentView);
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    publicApi.acceptContract.mockReturnValue(
      gate.then(() => ({ data: { ...sentView.data, status: "accepted" }, meta: {} })),
    );

    renderPortal();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Aceptar contrato" })).toBeEnabled(),
    );

    const user = userEvent.setup();
    const accept = screen.getByRole("button", { name: "Aceptar contrato" });
    const first = user.click(accept);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Registrando…" })).toBeDisabled(),
    );
    await user.click(screen.getByRole("button", { name: "Registrando…" }));
    release();
    await first;

    await waitFor(() => expect(screen.getByText(/Has aceptado/)).toBeVisible());
    expect(publicApi.acceptContract).toHaveBeenCalledTimes(1);
  });

  it("rechaza con comentario opcional", async () => {
    publicApi.contract.mockResolvedValue(sentView);
    publicApi.rejectContract.mockResolvedValue({
      data: { ...sentView.data, status: "rejected" },
      meta: {},
    });

    renderPortal();
    await waitFor(() => expect(screen.getByRole("button", { name: "Rechazar" })).toBeEnabled());

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    await user.type(screen.getByLabelText(/Comentario opcional/), "Mover la fecha");
    await user.click(screen.getByRole("button", { name: "Confirmar rechazo" }));

    expect(publicApi.rejectContract).toHaveBeenCalledWith("abc123", "Mover la fecha");
    await waitFor(() => expect(screen.getByText(/Has rechazado/)).toBeVisible());
  });

  it("muestra el resultado final sin acciones", async () => {
    publicApi.contract.mockResolvedValue({
      data: { ...sentView.data, status: "accepted", decided_at: "2026-10-02T10:00:00.000000Z" },
    });

    renderPortal();

    await waitFor(() => expect(screen.getByText(/Has aceptado este contrato/)).toBeVisible());
    expect(screen.queryByRole("button", { name: "Aceptar contrato" })).toBeNull();
  });
});
