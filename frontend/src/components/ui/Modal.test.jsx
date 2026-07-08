import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("no renderiza nada cerrado", () => {
    render(
      <Modal open={false} title="Oculto" onClose={vi.fn()}>
        <p>contenido</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("expone el titulo como nombre accesible del dialogo", () => {
    render(
      <Modal open title="Nueva tarea" onClose={vi.fn()}>
        <p>contenido</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "Nueva tarea" })).toBeInTheDocument();
  });

  it("cierra con Escape", async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Editar" onClose={onClose}>
        <button type="button">accion</button>
      </Modal>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cierra con el boton de cerrar", async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Editar" onClose={onClose}>
        <p>contenido</p>
      </Modal>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cerrar dialogo" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("mueve el foco dentro del dialogo al abrirse", () => {
    render(
      <Modal open title="Editar" onClose={vi.fn()}>
        <button type="button">primero</button>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
  });
});
