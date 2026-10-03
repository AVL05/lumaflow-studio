import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceMembers } from "./useWorkspaceMembers";
import { workspacesApi } from "../api/workspaces";

vi.mock("../api/workspaces", () => ({
  workspacesApi: {
    members: vi.fn(),
    invitations: vi.fn(),
    invite: vi.fn(),
    revokeInvitation: vi.fn(),
    removeMember: vi.fn(),
    accept: vi.fn(),
  },
}));

const membersPayload = (members) => ({ data: members, meta: { role: "owner" } });

describe("useWorkspaceMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga miembros e invitaciones cuando el rol administra", async () => {
    workspacesApi.members.mockResolvedValue(membersPayload([{ user_id: 1 }]));
    workspacesApi.invitations.mockResolvedValue([{ id: 9 }]);

    const { result } = renderHook(() => useWorkspaceMembers("owner"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.members).toEqual([{ user_id: 1 }]);
    expect(result.current.invitations).toEqual([{ id: 9 }]);
    expect(result.current.canAdminister).toBe(true);
  });

  it("no pide invitaciones cuando el rol es miembro", async () => {
    workspacesApi.members.mockResolvedValue(membersPayload([]));

    const { result } = renderHook(() => useWorkspaceMembers("member"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(workspacesApi.invitations).not.toHaveBeenCalled();
    expect(result.current.canAdminister).toBe(false);
  });

  it("muestra el error y permite reintentar", async () => {
    workspacesApi.members.mockRejectedValueOnce(new Error("Fallo de red"));
    workspacesApi.members.mockResolvedValueOnce(membersPayload([{ user_id: 2 }]));

    const { result } = renderHook(() => useWorkspaceMembers("owner"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();

    await act(() => result.current.reload());

    await waitFor(() => expect(result.current.members).toEqual([{ user_id: 2 }]));
  });

  it("invita y guarda el token de un solo uso", async () => {
    workspacesApi.members.mockResolvedValue(membersPayload([]));
    workspacesApi.invite.mockResolvedValue({ meta: { token: "secreto" } });

    const { result } = renderHook(() => useWorkspaceMembers("admin"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.invite("nueva@estudio.es", "member");
    });

    expect(ok).toBe(true);
    expect(workspacesApi.invite).toHaveBeenCalledWith({
      email: "nueva@estudio.es",
      role: "member",
    });
    expect(result.current.lastToken).toBe("secreto");
    expect(result.current.feedback).toMatch(/nueva@estudio.es/);
  });
});
