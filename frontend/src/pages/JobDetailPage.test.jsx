import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { JobDetailPage } from "./JobDetailPage";
import { jobsApi } from "../api/jobs";

vi.mock("../api/jobs", () => ({
  jobsApi: {
    show: vi.fn(),
    update: vi.fn(),
    briefing: vi.fn(),
    workflows: vi.fn(),
    options: vi.fn(),
  },
}));
vi.mock("../features/notifications/ToastContext", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const job = {
  id: 3,
  title: "Trabajo histórico",
  project_type: "photography",
  status: "quoted",
  production_phase: "preparation",
  specialty: "wedding",
  workflow_key: "wedding",
  description: "Descripción histórica intacta",
  contract_status: "not_required",
  budget: "500.00",
  deposit_amount: "0.00",
  briefing_revision: 0,
  briefing: {},
  sessions: [],
  tasks: [],
  deliveries: [],
  contracts: [],
  quotes: [{ id: 1, quote_number: "PRE-LEGACY", total: 500 }],
  invoices: [],
  activities: [],
  gear_items: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  jobsApi.show.mockResolvedValue(job);
  jobsApi.workflows.mockResolvedValue({ workflows: { wedding: { label: "Boda" } } });
  jobsApi.options.mockResolvedValue({ data: [], meta: { last_page: 1 } });
});
function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/app/jobs/:id", element: <JobDetailPage /> },
      { path: "/app/jobs", element: <p>Lista de proyectos</p> },
    ],
    { initialEntries: ["/app/jobs/3"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

it("no arrastra el formulario de un proyecto al cambiar de ID", async () => {
  const user = userEvent.setup();
  jobsApi.show.mockImplementation(async (id) => ({
    ...job,
    id: Number(id),
    title: `Proyecto ${id}`,
  }));
  const router = renderPage();
  await screen.findByRole("heading", { name: "Proyecto 3" });
  await user.click(screen.getByRole("button", { name: "Editar proyecto" }));
  await screen.findByRole("dialog", { name: "Editar proyecto" });
  await act(async () => router.navigate("/app/jobs/4"));
  await screen.findByRole("heading", { name: "Proyecto 4" });
  expect(screen.queryByRole("dialog", { name: "Editar proyecto" })).not.toBeInTheDocument();
});

it("mantiene descripción y documentos antiguos accesibles en sus secciones", async () => {
  const user = userEvent.setup();
  renderPage();
  expect(await screen.findByRole("heading", { name: job.title })).toBeVisible();
  expect(screen.getByText(job.description)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Gestión comercial" }));
  expect(screen.getByRole("link", { name: /PRE-LEGACY/ })).toBeVisible();
  expect(screen.getByRole("combobox", { name: /^Estado del contrato/ })).toBeEnabled();
});

it("conserva el briefing entre secciones y confirma el descarte al navegar", async () => {
  const user = userEvent.setup();
  renderPage();
  await screen.findByRole("heading", { name: job.title });
  await user.click(screen.getByRole("button", { name: "Briefing" }));
  await user.type(screen.getByLabelText("Objetivos creativos"), "Borrador local");
  await user.click(screen.getByRole("button", { name: "Planificación" }));
  await user.click(screen.getByRole("button", { name: /Briefing/ }));
  expect(screen.getByLabelText("Objetivos creativos")).toHaveValue("Borrador local");
  await user.click(screen.getByRole("link", { name: "← Proyectos" }));
  const dialog = await screen.findByRole("dialog", { name: "Cambios sin guardar" });
  await user.click(within(dialog).getByRole("button", { name: "Volver al proyecto" }));
  expect(screen.getByLabelText("Objetivos creativos")).toHaveValue("Borrador local");
});

it("un fallo al editar conserva el formulario y permite reintentar", async () => {
  const user = userEvent.setup();
  jobsApi.update.mockRejectedValue({ response: { data: { message: "Revisa las fechas" } } });
  renderPage();
  await screen.findByRole("heading", { name: job.title });
  await user.click(screen.getByRole("button", { name: "Editar proyecto" }));
  const dialog = await screen.findByRole("dialog", { name: "Editar proyecto" });
  const title = within(dialog).getByLabelText("Nombre del proyecto");
  await user.clear(title);
  await user.type(title, "Título corregido");
  await user.click(within(dialog).getByRole("button", { name: "Guardar proyecto" }));
  expect(await within(dialog).findByText("Revisa las fechas")).toBeVisible();
  expect(title).toHaveValue("Título corregido");
});
