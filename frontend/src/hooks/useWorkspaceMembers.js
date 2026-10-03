import { useCallback, useEffect, useState } from "react";
import { getApiError } from "../api/client";
import { workspacesApi } from "../api/workspaces";

export const WORKSPACE_ROLES = {
  owner: "Propietario",
  admin: "Administrador",
  member: "Miembro",
};

/**
 * Miembros e invitaciones del workspace actual. La autorizacion real vive en
 * el backend; aqui solo se ocultan acciones segun el rol para guiar la UI.
 */
export function useWorkspaceMembers(currentRole) {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [lastToken, setLastToken] = useState("");

  const canAdminister = currentRole === "owner" || currentRole === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const membersPayload = await workspacesApi.members();
      setMembers(membersPayload.data ?? []);
      if (canAdminister) {
        try {
          setInvitations(await workspacesApi.invitations());
        } catch {
          setInvitations([]);
        }
      } else {
        setInvitations([]);
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [canAdminister]);

  useEffect(() => {
    load();
  }, [load]);

  async function invite(email, role) {
    setSubmitting(true);
    setError("");
    setFeedback("");
    setLastToken("");
    try {
      const payload = await workspacesApi.invite({ email, role });
      setFeedback(`Invitación creada para ${email}.`);
      setLastToken(payload.meta?.token ?? "");
      await load();
      return true;
    } catch (err) {
      setError(getApiError(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function revokeInvitation(id) {
    setSubmitting(true);
    setError("");
    setFeedback("");
    try {
      await workspacesApi.revokeInvitation(id);
      setFeedback("Invitación revocada.");
      await load();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeMember(userId) {
    setSubmitting(true);
    setError("");
    setFeedback("");
    try {
      await workspacesApi.removeMember(userId);
      setFeedback("Miembro retirado del estudio.");
      await load();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function accept(token) {
    setSubmitting(true);
    setError("");
    setFeedback("");
    try {
      await workspacesApi.accept(token);
      setFeedback("Te has unido al estudio.");
      await load();
      return true;
    } catch (err) {
      setError(getApiError(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    members,
    invitations,
    loading,
    error,
    submitting,
    feedback,
    lastToken,
    canAdminister,
    reload: load,
    invite,
    revokeInvitation,
    removeMember,
    accept,
  };
}
