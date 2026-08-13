import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useCreateIntent } from "./useCreateIntent";

function Probe({ onCreate }) {
  useCreateIntent(onCreate);
  return null;
}

describe("useCreateIntent", () => {
  it("abre el formulario solicitado desde el botón global", async () => {
    const onCreate = vi.fn();
    render(
      <MemoryRouter initialEntries={["/app/clients?create=1"]}>
        <Probe onCreate={onCreate} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
  });
});
