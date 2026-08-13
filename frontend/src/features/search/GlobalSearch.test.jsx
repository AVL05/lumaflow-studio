import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GlobalSearch } from "./GlobalSearch";

describe("GlobalSearch", () => {
  it("funciona como command palette incluso sin término de búsqueda", async () => {
    const onOpenLuma = vi.fn();
    render(
      <MemoryRouter>
        <GlobalSearch
          open
          onOpen={() => {}}
          onClose={() => {}}
          onOpenLuma={onOpenLuma}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /Crear cliente/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir a calendario/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Preguntar a Luma/ }));
    expect(onOpenLuma).toHaveBeenCalledOnce();
  });
});
