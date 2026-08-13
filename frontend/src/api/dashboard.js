import { apiClient } from "./client";

export const dashboardApi = {
  summary: () => apiClient.get("/dashboard").then((res) => res.data.data),
  enableBookings: () =>
    apiClient.post("/activation/bookings").then((res) => res.data.data),
  activateSampleWorkspace: () =>
    apiClient.post("/activation/sample-workspace").then((res) => res.data.data),
};
