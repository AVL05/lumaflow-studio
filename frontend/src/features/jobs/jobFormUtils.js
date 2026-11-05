export const jobDefaults = {
  client_id: "",
  location_id: "",
  title: "",
  specialty: "general",
  workflow_key: "general",
  status: "lead",
  event_date: "",
  description: "",
  budget: "",
  deposit_amount: "0",
  contract_status: "not_required",
  contract_url: "",
  gear_item_ids: [],
  create_workflow_tasks: true,
  project_type: "photography",
  participants: [],
  start_date: "",
  end_date: "",
  delivery_due_date: "",
  location_ids: [],
  external_links: [],
};

export const projectTypes = [
  { value: "photography", label: "Fotográfico" },
  { value: "audiovisual", label: "Audiovisual" },
  { value: "personal", label: "Personal" },
];

export const productionPhases = [
  { value: "preparation", label: "Preparación" },
  { value: "production", label: "Producción" },
  { value: "postproduction", label: "Postproducción" },
  { value: "delivery", label: "Entrega" },
];

export function jobToForm(job) {
  return {
    ...Object.fromEntries(
      Object.entries(jobDefaults).map(([key, fallback]) => [key, job[key] ?? fallback]),
    ),
    gear_item_ids: job.gear_items?.map((item) => item.id) ?? [],
    location_ids: job.locations?.map((item) => item.id) ?? [],
    create_workflow_tasks: false,
  };
}

export function normalizeJob(form) {
  return {
    ...form,
    client_id: form.client_id ? Number(form.client_id) : null,
    location_id: form.location_id ? Number(form.location_id) : null,
    budget: form.budget === "" ? null : Number(form.budget),
    deposit_amount: Number(form.deposit_amount || 0),
    event_date: form.event_date || null,
    contract_url: form.contract_url || null,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    delivery_due_date: form.delivery_due_date || null,
  };
}
