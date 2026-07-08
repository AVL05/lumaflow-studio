import { apiClient } from "./client";

export const activitiesApi = {
  list: (params) =>
    apiClient.get("/activities", { params }).then((res) => (params ? res.data : res.data.data)),
  sessionTimeline: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}/timeline`).then((res) => res.data.data),
};
