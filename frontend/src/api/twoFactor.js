import { apiClient } from "./client";

export const twoFactorApi = {
  setup: () => apiClient.post("/two-factor/setup").then((res) => res.data),
  confirm: (code) => apiClient.post("/two-factor/confirm", { code }).then((res) => res.data),
  disable: (payload) => apiClient.post("/two-factor/disable", payload).then((res) => res.data),
};
