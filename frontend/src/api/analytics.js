import { apiClient } from "./client";

export const analyticsApi = {
  summary: (params) => apiClient.get("/analytics", { params }).then((res) => res.data.data),
};
