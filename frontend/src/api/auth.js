import { apiClient } from "./client";

export const authApi = {
  register: (payload) => apiClient.post("/register", payload).then((res) => res.data),
  login: (payload) => apiClient.post("/login", payload).then((res) => res.data),
  forgotPassword: (payload) => apiClient.post("/forgot-password", payload).then((res) => res.data),
  resetPassword: (payload) => apiClient.post("/reset-password", payload).then((res) => res.data),
  resendVerification: () =>
    apiClient.post("/email/verification-notification").then((res) => res.data),
  completeOnboarding: (payload) =>
    apiClient.post("/onboarding", payload).then((res) => res.data.data),
  completeGettingStarted: (choice) =>
    apiClient.post("/getting-started", { choice }).then((res) => res.data.data),
  logout: () => apiClient.post("/logout").then((res) => res.data),
  me: () => apiClient.get("/user").then((res) => res.data.data),
};
