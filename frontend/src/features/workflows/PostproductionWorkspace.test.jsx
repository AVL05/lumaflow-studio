import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { workflowsApi } from "../../api/workflows";
import { PostproductionWorkspace } from "./PostproductionWorkspace";

vi.mock("../../api/workflows", () => ({
  workflowsApi: {
    show: vi.fn(),
    templates: vi.fn(),
    preview: vi.fn(),
    apply: vi.fn(),
    updateStage: vi.fn(),
    createStage: vi.fn(),
    createTask: vi.fn(),
    moveStage: vi.fn(),
  },
}));
const template = {
  key: "portrait",
  name: "Retrato",
  revision: 0,
  description: "Sin fechas",
  definition: { tasks: [], checklists: [], stages: [] },
};
const stage = {
  id: 5,
  label: "Selección",
  status: "pending",
  revision: 0,
  progress: 0,
  pending_tasks: 0,
  tasks: [],
  checklists: [],
};
const board = {
  stages: [stage],
  tasks: [],
  checklists: [],
  members: [{ id: 1, name: "Equipo sintético" }],
  applications: [],
};
const job = { id: 3, sessions: [], participants: [], delivery_due_date: null };
beforeEach(() => {
  vi.clearAllMocks();
  workflowsApi.show.mockResolvedValue(board);
  workflowsApi.templates.mockResolvedValue({
    builtins: [template],
    data: [],
    meta: { last_page: 1 },
  });
  workflowsApi.preview.mockResolvedValue({
    template,
    hash: "a".repeat(64),
    already_applied: false,
    plan: { stages: [], tasks: [{ title: "Preparar retratos", action: "create" }], checklists: [] },
  });
});

it("previsualiza sin escribir y exige confirmar antes de aplicar", async () => {
  const user = userEvent.setup();
  render(<PostproductionWorkspace job={job} />);
  await screen.findByRole("article", { name: "Etapa Selección" });
  await user.click(screen.getByRole("button", { name: "Plantillas", exact: true }));
  const card = await screen.findByRole("article", { name: "Plantilla Retrato" });
  await user.click(within(card).getByRole("button", { name: "Previsualizar" }));
  const dialog = await screen.findByRole("dialog", { name: "Previsualizar plantilla" });
  const confirm = within(dialog).getByRole("button", { name: "Confirmar aplicación" });
  expect(confirm).toBeDisabled();
  expect(workflowsApi.apply).not.toHaveBeenCalled();
  await user.click(within(dialog).getByText(/Tareas ·/));
  expect(within(dialog).getByText("Crear: Preparar retratos")).toBeVisible();
  await user.click(within(dialog).getByRole("checkbox"));
  await user.click(confirm);
  expect(workflowsApi.apply).toHaveBeenCalledWith(3, "portrait", "a".repeat(64));
});

it("conserva observaciones y advierte de descarte ante un conflicto", async () => {
  const user = userEvent.setup();
  workflowsApi.updateStage.mockRejectedValue({
    response: { status: 409, data: { message: "La etapa ha cambiado" } },
  });
  const dirty = vi.fn();
  render(<PostproductionWorkspace job={job} onDirtyChange={dirty} />);
  const card = await screen.findByRole("article", { name: "Etapa Selección" });
  await user.click(within(card).getByRole("button", { name: "Editar etapa" }));
  const dialog = screen.getByRole("dialog", { name: "Configurar etapa" });
  const notes = within(dialog).getByLabelText("Observaciones de la etapa");
  await user.type(notes, "Revisar selección sintética");
  await user.click(within(dialog).getByRole("button", { name: "Guardar etapa" }));
  expect(await within(dialog).findByText("La etapa ha cambiado")).toBeVisible();
  expect(notes).toHaveValue("Revisar selección sintética");
  expect(dirty).toHaveBeenLastCalledWith(true);
  await user.click(within(dialog).getByRole("button", { name: "Cerrar dialogo" }));
  expect(within(dialog).getByRole("button", { name: "Seguir editando" })).toBeVisible();
});

it("reutiliza el formulario de tareas con asignación y fechas explícitas", async () => {
  const user = userEvent.setup();
  render(<PostproductionWorkspace job={job} />);
  const card = await screen.findByRole("article", { name: "Etapa Selección" });
  await user.click(within(card).getByRole("button", { name: "Añadir tarea", exact: true }));
  const dialog = screen.getByRole("dialog", { name: "Tarea del proyecto" });
  expect(within(dialog).getByLabelText("Fecha limite")).toHaveValue("");
  expect(within(dialog).getByLabelText("Responsable de la tarea")).toHaveValue("");
  await user.type(within(dialog).getByLabelText("Titulo"), "Revisar selección");
  await user.selectOptions(within(dialog).getByLabelText("Responsable de la tarea"), "1");
  await user.click(within(dialog).getByRole("button", { name: "Guardar tarea" }));
  expect(workflowsApi.createTask).toHaveBeenCalledWith(
    3,
    expect.objectContaining({ stage_id: 5, assigned_user_id: 1, due_date: null }),
  );
});

it("reordena mediante controles de teclado y conecta módulos existentes", async () => {
  const user = userEvent.setup();
  const navigate = vi.fn();
  render(<PostproductionWorkspace job={job} onSectionChange={navigate} />);
  await screen.findByRole("article", { name: "Etapa Selección" });
  await user.click(screen.getByRole("button", { name: "Subir etapa Selección" }));
  expect(workflowsApi.moveStage).toHaveBeenCalledWith(3, 5, "up", 0);
  await user.click(screen.getByRole("button", { name: "Tomas y jornadas" }));
  expect(navigate).toHaveBeenCalledWith("production");
});
