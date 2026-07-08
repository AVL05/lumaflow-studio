import { apiClient } from "./client";

export const calendarApi = {
  events: ({ from, to, sources }) =>
    apiClient
      .get("/calendar", {
        params: { from, to, sources: sources?.length ? sources.join(",") : undefined },
      })
      .then((res) => res.data.data),
  move: ({ source, sourceId, date, time }) =>
    apiClient
      .patch("/calendar/move", {
        source,
        source_id: sourceId,
        date,
        time: time || null,
      })
      .then((res) => res.data),
};
