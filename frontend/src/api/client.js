import axios from "axios";
import { buildRequestId, extractErrorReference } from "../app/sentry";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("lumaflow_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["X-Request-ID"] ??= buildRequestId();

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("lumaflow_token");
    }

    return Promise.reject(error);
  },
);

export function getApiError(error, fallback = "No se pudo completar la operacion.") {
  const errors = error.response?.data?.errors;

  if (errors) {
    return Object.values(errors).flat().join(" ");
  }

  const message = error.response?.data?.message ?? fallback;
  const reference = extractErrorReference(error);

  return reference ? `${message} (Ref: ${reference})` : message;
}
