export const jobDefaults = {
  client_id: "", location_id: "", title: "", specialty: "general", workflow_key: "general",
  status: "lead", event_date: "", description: "", budget: "", deposit_amount: "0",
  contract_status: "not_required", contract_url: "", gear_item_ids: [], create_workflow_tasks: true,
};

export function normalizeJob(form) {
  return { ...form, client_id: form.client_id ? Number(form.client_id) : null, location_id: form.location_id ? Number(form.location_id) : null, budget: form.budget === "" ? null : Number(form.budget), deposit_amount: Number(form.deposit_amount || 0), event_date: form.event_date || null, contract_url: form.contract_url || null };
}
