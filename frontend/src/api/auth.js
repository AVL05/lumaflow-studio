import { apiClient } from "./client";

export const authApi = {
  register: (payload) => apiClient.post("/register", payload).then((res) => res.data),
  login: (payload) => apiClient.post("/login", payload).then((res) => res.data),
  forgotPassword: (payload) => apiClient.post("/forgot-password", payload).then((res) => res.data),
  resetPassword: (payload) => apiClient.post("/reset-password", payload).then((res) => res.data),
  logout: () => apiClient.post("/logout").then((res) => res.data),
  me: () => apiClient.get("/user").then((res) => res.data.data),
};
