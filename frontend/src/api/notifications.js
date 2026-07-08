import { apiClient } from "./client";

export const notificationsApi = {
  list: (params) => apiClient.get("/notifications", { params }).then((res) => res.data),
  unreadCount: () =>
    apiClient.get("/notifications/unread-count").then((res) => res.data.unread),
  markRead: (id) =>
    apiClient.patch(`/notifications/${id}/read`).then((res) => res.data.data),
  markAllRead: () =>
    apiClient.patch("/notifications/read-all").then((res) => res.data),
  remove: (id) => apiClient.delete(`/notifications/${id}`),
  clear: (only) =>
    apiClient
      .delete("/notifications/clear", { params: only ? { only } : undefined })
      .then((res) => res.data),
};
