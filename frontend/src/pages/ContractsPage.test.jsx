import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContractsPage } from "./ContractsPage";

vi.mock("../api/contracts", () => ({
  contractsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    status: vi.fn(),
    remove: vi.fn(),
    show: vi.fn(),
  },
}));

vi.mock("../api/clients", () => ({
  clientsApi: { list: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock("../api/jobs", () => ({ jobsApi: { list: vi.fn().mockResolvedValue({ data: [] }) } }));
vi.mock("../api/quotes", () => ({ quotesApi: { list: vi.fn().mockResolvedValue({ data: [] }) } }));
vi.mock("../features/notifications/ToastContext", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

import { contractsApi } from "../api/contracts";

function page(items) {
  return { data: items, meta: { current_page: 1, last_page: 1 } };
}

function draft(overrides = {}) {
  return {
    id: 1,
    contract_number: "CON-2026-0001",
    title: "Contrato boda",
    status: "draft",
    version: 1,
    client: { name: "Novios" },
    ...overrides,
  };
}

describe("ContractsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el empty state con CTA cuando no hay contratos", async () => {
    contractsApi.list.mockResolvedValue(page([]));

    render(
      <MemoryRouter>
        <ContractsPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Aún no tienes contratos")).toBeVisible());
    expect(screen.getByRole("button", { name: "Crear mi primer contrato" })).toBeVisible();
  });

  it("deshabilita edicion y borrado en contratos enviados", async () => {
    contractsApi.list.mockResolvedValue(
      page([draft(), draft({ id: 2, contract_number: "CON-2026-0002", status: "sent" })]),
    );

    render(
      <MemoryRouter>
        <ContractsPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/CON-2026-0001/)).toBeVisible());

    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    expect(editButtons[0]).toBeEnabled();
    expect(editButtons[1]).toBeDisabled();

    const deleteButtons = screen.getAllByRole("button", { name: "Eliminar" });
    expect(deleteButtons[0]).toBeEnabled();
    expect(deleteButtons[1]).toBeDisabled();
  });

  it("muestra el error de carga", async () => {
    contractsApi.list.mockRejectedValue(new Error("Fallo de red"));

    render(
      <MemoryRouter>
        <ContractsPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/No se pudo completar/)).toBeVisible());
  });
});
