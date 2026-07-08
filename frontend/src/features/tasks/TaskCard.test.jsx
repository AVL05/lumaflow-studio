import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskCard } from "./TaskCard";

const task = {
  id: 7,
  title: "Confirmar permisos",
  description: "Llamar a recepcion",
  priority: "urgent",
  status: "todo",
  due_date: "2026-07-20",
  due_time: "10:00",
  is_overdue: false,
  session: { id: 1, name: "Editorial urbano" },
  client: null,
};

function renderCard(overrides = {}, handlers = {}) {
  const props = {
    task: { ...task, ...overrides },
    selected: false,
    onSelect: vi.fn(),
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...handlers,
  };

  render(<TaskCard {...props} />);

  return props;
}

describe("TaskCard", () => {
  it("traduce prioridad y estado a las etiquetas del catalogo", () => {
    renderCard();

    expect(screen.getByText("Urgente")).toBeInTheDocument();
    expect(screen.getByText("Por hacer")).toBeInTheDocument();
  });

  it("muestra fecha, hora y sesion asociada", () => {
    renderCard();

    expect(screen.getByText(/2026-07-20/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/Editorial urbano/)).toBeInTheDocument();
  });

  it("marca las tareas vencidas", () => {
    renderCard({ is_overdue: true });

    expect(screen.getByText(/vencida/)).toBeInTheDocument();
  });

  it("ofrece reabrir en lugar de completar cuando ya esta completada", () => {
    renderCard({ status: "completed" });

    expect(screen.getByRole("button", { name: "Reabrir" })).toBeInTheDocument();
  });

  it("propaga la seleccion con el id de la tarea", async () => {
    const { onSelect } = renderCard();

    await userEvent.click(screen.getByRole("checkbox", { name: /Seleccionar Confirmar permisos/ }));

    expect(onSelect).toHaveBeenCalledWith(7);
  });

  it("propaga completar, editar y eliminar con la tarea completa", async () => {
    const { onToggle, onEdit, onDelete } = renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Completar" }));
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });
});
