import { apiClient } from "./client";

export const bulkApi = {
  run: (resource, action, ids, payload = {}) =>
    apiClient
      .post("/bulk-actions", { resource, action, ids, ...payload })
      .then((res) => res.data),
};
