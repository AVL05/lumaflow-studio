export const shotStatuses = [
  { value: "pending", label: "Pendiente" },
  { value: "ready", label: "Preparada" },
  { value: "done", label: "Realizada" },
  { value: "discarded", label: "Descartada" },
];
export const emptyShot = {
  description: "",
  scene: "",
  shot_type: "",
  camera_movement: "",
  focal_length: "",
  estimated_seconds: "",
  scheduled_time: "",
  notes: "",
  status: "pending",
  session_id: "",
  location_id: "",
  gear_item_ids: [],
};
export function shotForm(shot) {
  return {
    ...Object.fromEntries(
      Object.entries(emptyShot).map(([key, fallback]) => [key, shot?.[key] ?? fallback]),
    ),
    scheduled_time: shot?.scheduled_time?.slice(0, 5) ?? "",
    gear_item_ids: shot?.gear_items?.map((item) => item.id) ?? [],
  };
}
export function shotPayload(form) {
  return {
    ...form,
    session_id: form.session_id ? Number(form.session_id) : null,
    location_id: form.location_id || null,
    estimated_seconds: form.estimated_seconds ? Number(form.estimated_seconds) : null,
    scheduled_time: form.scheduled_time || null,
  };
}
export function dayForm(job, day) {
  return {
    name: day?.name ?? "",
    date: day?.date ?? "",
    time: day?.time?.slice(0, 5) ?? "",
    end_time: day?.end_time?.slice(0, 5) ?? "",
    location_id: day?.location_id ?? "",
    location_name: day?.location_name ?? "",
    participants: day?.participants ?? job.participants ?? [],
    session_type: day?.session_type ?? "other",
    status: day?.status ?? "planned",
    notes: day?.notes ?? "",
    incidents: day?.incidents ?? "",
  };
}
