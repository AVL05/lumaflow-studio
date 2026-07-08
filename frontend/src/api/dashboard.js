import { apiClient } from "./client";

export const dashboardApi = {
  summary: () => apiClient.get("/dashboard").then((res) => res.data.data),
};
