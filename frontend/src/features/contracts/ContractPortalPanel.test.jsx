import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContractPortalPanel } from "./ContractPortalPanel";

vi.mock("../../api/contracts", () => ({
  contractsApi: {
    portal: vi.fn(),
    generatePortal: vi.fn(),
    regeneratePortal: vi.fn(),
    revokePortal: vi.fn(),
  },
}));

import { contractsApi } from "../../api/contracts";

const sent = { id: 7, status: "sent" };
const draft = { id: 8, status: "draft" };

describe("ContractPortalPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pide generar cuando no hay enlace", async () => {
    contractsApi.portal.mockResolvedValue(null);

    render(<ContractPortalPanel contract={sent} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Generar enlace" })).toBeVisible(),
    );
  });

  it("explica que el borrador aun no tiene portal", async () => {
    contractsApi.portal.mockResolvedValue(null);

    render(<ContractPortalPanel contract={draft} />);

    await waitFor(() =>
      expect(screen.getByText(/Envía el contrato para poder generar/)).toBeVisible(),
    );
    expect(screen.queryByRole("button", { name: "Generar enlace" })).toBeNull();
  });

  it("genera, muestra el enlace para copiar y revoca", async () => {
    contractsApi.portal.mockResolvedValue(null);
    contractsApi.generatePortal.mockResolvedValue({
      data: { active: true, expires_at: null },
      meta: { token: "secreto-unico" },
    });

    render(<ContractPortalPanel contract={sent} />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Generar enlace" }));

    expect(contractsApi.generatePortal).toHaveBeenCalledWith(7, null);
    await waitFor(() => expect(screen.getByText(/\/contract\/secreto-unico/)).toBeVisible());

    contractsApi.revokePortal.mockResolvedValue({});
    await user.click(screen.getByRole("button", { name: "Revocar" }));
    expect(contractsApi.revokePortal).toHaveBeenCalledWith(7);
  });

  it("muestra el resultado y el comentario de rechazo", async () => {
    contractsApi.portal.mockResolvedValue(null);

    render(
      <ContractPortalPanel
        contract={{
          ...sent,
          status: "rejected",
          client_responded_at: "2026-10-02T10:00:00.000000Z",
          client_message: "Mover la fecha",
        }}
      />,
    );

    await waitFor(() => expect(screen.getByText(/Rechazado/)).toBeVisible());
    expect(screen.getByText(/Mover la fecha/)).toBeVisible();
  });
});
