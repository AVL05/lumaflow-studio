import { apiClient } from "./client";

export const workspacesApi = {
  members: () => apiClient.get("/workspace/members").then((res) => res.data),
  switchCurrent: (workspaceId) =>
    apiClient.put("/workspace/current", { workspace_id: workspaceId }).then((res) => res.data.data),
  invitations: () => apiClient.get("/workspace/invitations").then((res) => res.data.data),
  invite: (payload) => apiClient.post("/workspace/invitations", payload).then((res) => res.data),
  revokeInvitation: (id) => apiClient.delete(`/workspace/invitations/${id}`),
  removeMember: (userId) => apiClient.delete(`/workspace/members/${userId}`),
  accept: (token) =>
    apiClient.post("/workspace/invitations/accept", { token }).then((res) => res.data.data),
};
