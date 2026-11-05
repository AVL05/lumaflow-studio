import { describe, expect, it } from "vitest";
import { jobDefaults, normalizeJob, jobToForm } from "./jobFormUtils";

describe("proyectos creativos", () => {
  it("normaliza un proyecto personal sin cliente ni fechas inventadas", () => {
    expect(normalizeJob({ ...jobDefaults, project_type: "personal" })).toMatchObject({
      project_type: "personal",
      client_id: null,
      start_date: null,
      end_date: null,
      delivery_due_date: null,
    });
  });
  it("reutiliza datos antiguos y conserva relaciones y campos comerciales al editar", () => {
    const form = jobToForm({
      id: 4,
      title: "Antiguo",
      client_id: 2,
      description: "Notas",
      budget: "500.00",
      gear_items: [{ id: 8 }],
      locations: [{ id: 9 }],
    });
    expect(normalizeJob(form)).toMatchObject({
      title: "Antiguo",
      description: "Notas",
      budget: 500,
      client_id: 2,
      gear_item_ids: [8],
      location_ids: [9],
      project_type: "photography",
    });
  });
});
