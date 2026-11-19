import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CalendarEvent } from "./CalendarEvent";

it("muestra el fin de la jornada y conserva sesiones anteriores sin hora final", () => {
  const event = {
    source: "session",
    title: "Sesión sintética",
    time: "09:00",
    meta: { end_time: "18:00" },
  };
  const { rerender } = render(<CalendarEvent event={event} />);
  expect(screen.getByText("09:00–18:00")).toBeVisible();
  rerender(<CalendarEvent event={{ ...event, meta: {} }} />);
  expect(screen.getByText("09:00")).toBeVisible();
});
