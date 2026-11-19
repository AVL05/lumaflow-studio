import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { ProductionWorkspace } from "./ProductionWorkspace";
import { productionApi } from "../../api/production";

vi.mock("../../api/production", () => ({
  productionApi: {
    shots: vi.fn(),
    days: vi.fn(),
    updateShot: vi.fn(),
    createShot: vi.fn(),
    move: vi.fn(),
    duplicate: vi.fn(),
    remove: vi.fn(),
  },
}));
vi.mock("../../api/jobs", () => ({
  jobsApi: { options: vi.fn().mockResolvedValue({ data: [], meta: {} }) },
}));
const job = { id: 3, project_type: "photography", sessions: [], participants: [] };
const shot = {
  id: 8,
  description: "Retrato sintético",
  status: "pending",
  revision: 0,
  notes: "",
  gear_items: [],
};
const page = (data) => ({ data, meta: { current_page: 1, last_page: 1, total: data.length } });
beforeEach(() => {
  vi.clearAllMocks();
  productionApi.shots.mockResolvedValue(page([shot]));
  productionApi.days.mockResolvedValue(page([]));
});

it("permite estado rápido en modo rodaje sin perder identidad ni revisión", async () => {
  const user = userEvent.setup();
  render(<ProductionWorkspace job={job} />);
  expect(await screen.findByRole("heading", { name: "Retrato sintético" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Fotografías previstas" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Modo rodaje" }));
  expect(screen.queryByRole("button", { name: "Duplicar" })).not.toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Estado de toma 8" }), "done");
  expect(productionApi.updateShot).toHaveBeenCalledWith(3, 8, { status: "done", revision: 0 });
});

it("un conflicto conserva observaciones y requiere descarte explícito", async () => {
  const user = userEvent.setup();
  productionApi.updateShot.mockRejectedValue({
    response: { status: 409, data: { message: "La toma ha cambiado" } },
  });
  const onDirtyChange = vi.fn();
  render(<ProductionWorkspace job={job} onDirtyChange={onDirtyChange} />);
  await screen.findByRole("heading", { name: shot.description });
  await user.click(screen.getByRole("button", { name: "Observaciones" }));
  const dialog = screen.getByRole("dialog", { name: "Observaciones de rodaje" });
  const notes = within(dialog).getByLabelText("Observaciones de la toma");
  await user.type(notes, "Borrador de rodaje");
  await user.click(within(dialog).getByRole("button", { name: "Guardar observaciones" }));
  expect(await within(dialog).findByText("La toma ha cambiado")).toBeVisible();
  expect(notes).toHaveValue("Borrador de rodaje");
  expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  await user.click(within(dialog).getByRole("button", { name: "Cerrar dialogo" }));
  expect(within(dialog).getByRole("button", { name: "Seguir editando" })).toBeVisible();
  await user.click(within(dialog).getByRole("button", { name: "Seguir editando" }));
  expect(notes).toHaveValue("Borrador de rodaje");
});

it("reordena con botones accesibles y confirma antes de eliminar", async () => {
  const user = userEvent.setup();
  render(<ProductionWorkspace job={job} />);
  await screen.findByRole("heading", { name: shot.description });
  await user.click(screen.getByRole("button", { name: "Subir toma 8" }));
  expect(productionApi.move).toHaveBeenCalledWith(3, 8, "up");
  await user.click(screen.getByRole("button", { name: "Eliminar", exact: true }));
  expect(productionApi.remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
  expect(productionApi.remove).toHaveBeenCalledWith(3, 8);
});

it("muestra errores de carga y permite reintentar", async () => {
  productionApi.shots.mockRejectedValueOnce({
    response: { data: { message: "API no disponible" } },
  });
  const user = userEvent.setup();
  render(<ProductionWorkspace job={job} />);
  await screen.findByText("API no disponible");
  await user.click(screen.getByRole("button", { name: /Reintentar/ }));
  expect(await screen.findByRole("heading", { name: shot.description })).toBeVisible();
});
