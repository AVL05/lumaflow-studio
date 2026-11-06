import { expect, it } from "vitest";
import { dayForm, shotForm, shotPayload } from "./productionFormUtils";

it("normaliza tomas sin exigir escena, jornada ni óptica", () => {
  const form = shotForm({ description: "Retrato" });
  expect(shotPayload(form)).toMatchObject({
    description: "Retrato",
    scene: "",
    session_id: null,
    location_id: null,
    estimated_seconds: null,
    scheduled_time: null,
  });
});
it("conserva equipo y convierte horas y duración de una toma existente", () => {
  const form = shotForm({
    description: "Detalle",
    gear_items: [{ id: 4 }],
    scheduled_time: "09:30:00",
    session_id: 7,
  });
  expect(shotPayload({ ...form, estimated_seconds: "25" })).toMatchObject({
    gear_item_ids: [4],
    scheduled_time: "09:30",
    session_id: 7,
    estimated_seconds: 25,
  });
});
it("la jornada reutiliza participantes sin inventar fecha ni alterar la sesión antigua", () => {
  const participants = [{ name: "Equipo sintético", role: "Sonido" }];
  expect(dayForm({ participants })).toMatchObject({
    date: "",
    participants,
    session_type: "other",
    status: "planned",
  });
  expect(
    dayForm(
      { participants },
      {
        name: "Sesión antigua",
        date: "2030-01-01",
        time: "09:00:00",
        participants: [],
        session_type: "portrait",
        status: "confirmed",
      },
    ),
  ).toMatchObject({
    time: "09:00",
    participants: [],
    session_type: "portrait",
    status: "confirmed",
  });
});
