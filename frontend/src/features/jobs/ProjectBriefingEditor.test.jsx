import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProjectBriefingEditor } from "./ProjectBriefingEditor";
import { jobsApi } from "../../api/jobs";

vi.mock("../../api/jobs", () => ({ jobsApi: { briefing: vi.fn(), show: vi.fn() } }));

describe("briefing manual", () => {
  it("guarda campos estructurados sin IA y con revisión explícita", async () => {
    const user = userEvent.setup();
    jobsApi.briefing.mockResolvedValue({ briefing_revision: 1 });
    render(
      <ProjectBriefingEditor
        job={{ id: 1, briefing: {}, briefing_revision: 0 }}
        onSaved={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText("Objetivos creativos"), "Contar una historia");
    await user.click(screen.getByRole("button", { name: "Guardar briefing" }));
    expect(jobsApi.briefing).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ objectives: "Contar una historia" }),
      0,
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Briefing guardado");
  });

  it("un conflicto conserva el borrador y exige confirmar antes de reemplazarlo", async () => {
    const user = userEvent.setup();
    jobsApi.briefing.mockRejectedValue({
      response: { status: 409, data: { message: "El briefing ha cambiado." } },
    });
    jobsApi.show.mockResolvedValue({
      briefing: { objectives: "Versión guardada" },
      briefing_revision: 2,
    });
    render(
      <ProjectBriefingEditor
        job={{ id: 1, briefing: { objectives: "Inicial" }, briefing_revision: 0 }}
        onSaved={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    );
    const field = screen.getByLabelText("Objetivos creativos");
    await user.clear(field);
    await user.type(field, "Mi borrador");
    await user.click(screen.getByRole("button", { name: "Guardar briefing" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El briefing ha cambiado");
    expect(field).toHaveValue("Mi borrador");
    await user.click(screen.getByRole("button", { name: "Cargar versión guardada" }));
    expect(jobsApi.show).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Descartar y cargar" }));
    expect(await screen.findByDisplayValue("Versión guardada")).toBeVisible();
  });

  it("un error de validación permite corregir el texto sin perderlo", async () => {
    const user = userEvent.setup();
    jobsApi.briefing.mockRejectedValue({
      response: { status: 422, data: { message: "Entrada inválida" } },
    });
    render(
      <ProjectBriefingEditor
        job={{ id: 1, briefing: {}, briefing_revision: 0 }}
        onSaved={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText("Riesgos"), "Ruido exterior");
    await user.click(screen.getByRole("button", { name: "Guardar briefing" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Entrada inválida");
    expect(screen.getByLabelText("Riesgos")).toHaveValue("Ruido exterior");
  });
});
