import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConversationSidebar } from "./ConversationSidebar";

const conversations = [
  { id: "a", title: "Boda", messages_count: 2 },
  { id: "b", title: "Retrato", messages_count: 4 },
];

describe("ConversationSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function props(overrides = {}) {
    return {
      conversations,
      activeId: "a",
      search: "",
      onSearch: vi.fn(),
      onNew: vi.fn(),
      onSelect: vi.fn(),
      onRename: vi.fn(),
      onDelete: vi.fn(),
      onClear: vi.fn(),
      ...overrides,
    };
  }

  it("muestra el estado vacio sin acciones de borrado", () => {
    render(<ConversationSidebar {...props({ conversations: [] })} />);

    expect(screen.getByText("Sin conversaciones.")).toBeVisible();
    expect(screen.queryByText(/Borrar historial/)).toBeNull();
  });

  it("lista, abre, renombra y borra por callbacks", async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<ConversationSidebar {...callbacks} />);

    await user.click(screen.getByText("Retrato"));
    expect(callbacks.onSelect).toHaveBeenCalledWith(conversations[1]);

    await user.click(screen.getByText("Nueva"));
    expect(callbacks.onNew).toHaveBeenCalled();

    await user.click(screen.getAllByText("Editar")[0]);
    expect(callbacks.onRename).toHaveBeenCalledWith(conversations[0]);

    await user.click(screen.getAllByText("Borrar")[1]);
    expect(callbacks.onDelete).toHaveBeenCalledWith(conversations[1]);
  });

  it("pide borrar todo el historial del estudio", async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<ConversationSidebar {...callbacks} />);

    await user.click(screen.getByText("Borrar historial de este estudio"));
    expect(callbacks.onClear).toHaveBeenCalledTimes(1);
  });
});
