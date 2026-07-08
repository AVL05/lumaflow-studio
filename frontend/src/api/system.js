import { apiClient } from "./client";

export const systemApi = {
  status: () => apiClient.get("/system").then((res) => res.data.data),
};
