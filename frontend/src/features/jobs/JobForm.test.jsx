import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { JobForm } from "./JobForm";
import { jobDefaults, normalizeJob } from "./jobFormUtils";
vi.mock("../../api/jobs", () => ({
  jobsApi: { options: vi.fn().mockResolvedValue({ data: [], meta: { last_page: 1 } }) },
}));

it("crea un proyecto personal sin inventar cliente, participantes ni fechas", async () => {
  const save = vi.fn();
  function Harness() {
    const [form, setForm] = useState(jobDefaults);
    return (
      <JobForm
        form={form}
        setForm={setForm}
        clients={[]}
        workflows={{ general: { label: "General" } }}
        onSubmit={(e) => {
          e.preventDefault();
          save(normalizeJob(form));
        }}
      />
    );
  }
  const user = userEvent.setup();
  render(<Harness />);
  await user.type(screen.getByLabelText("Nombre del proyecto"), "Mi documental");
  await user.selectOptions(screen.getByRole("combobox", { name: /^Tipo de proyecto/ }), "personal");
  await user.click(screen.getByRole("button", { name: "Crear proyecto" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      project_type: "personal",
      client_id: null,
      participants: [],
      start_date: null,
    }),
  );
});
