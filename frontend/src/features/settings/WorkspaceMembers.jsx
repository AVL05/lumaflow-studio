import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Panel } from "../../components/ui/Panel";
import { ErrorState } from "../../components/states/ErrorState";
import { EmptyState } from "../../components/states/EmptyState";
import { WORKSPACE_ROLES, useWorkspaceMembers } from "../../hooks/useWorkspaceMembers";

export function WorkspaceMembers({ currentUserId, currentRole }) {
  const {
    members,
    invitations,
    loading,
    error,
    submitting,
    feedback,
    lastToken,
    canAdminister,
    reload,
    invite,
    revokeInvitation,
    removeMember,
    accept,
  } = useWorkspaceMembers(currentRole);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [token, setToken] = useState("");

  async function onInvite(event) {
    event.preventDefault();
    const ok = await invite(email.trim(), role);
    if (ok) setEmail("");
  }

  async function onAccept(event) {
    event.preventDefault();
    const ok = await accept(token.trim());
    if (ok) setToken("");
  }

  return (
    <Panel className="mt-5 p-6">
      <h2 className="text-lg font-semibold">Miembros del estudio</h2>
      <p className="mt-1 text-sm text-stone-400">
        Quién puede trabajar en este estudio y con qué rol.
      </p>

      {loading ? <p className="mt-4 text-sm text-stone-400">Cargando miembros…</p> : null}
      {!loading && error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && feedback ? (
        <p role="status" className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {feedback}
        </p>
      ) : null}

      {!loading && !error && members.length === 0 ? (
        <EmptyState title="Sin miembros" description="Todavía no hay miembros en este estudio." />
      ) : null}

      {!loading && !error && members.length > 0 ? (
        <ul className="mt-4 divide-y divide-white/5">
          {members.map((member) => (
            <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold text-stone-100">
                  {member.name}
                  {member.user_id === currentUserId ? <span className="ml-2 text-xs text-stone-500">(tú)</span> : null}
                </p>
                <p className="text-xs text-stone-500">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-stone-300">
                  {WORKSPACE_ROLES[member.role] ?? member.role}
                </span>
                {canAdminister && member.user_id !== currentUserId ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => removeMember(member.user_id)}
                    className="text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-50"
                  >
                    Retirar
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !error && canAdminister ? (
        <div className="mt-5 border-t border-white/5 pt-5">
          <h3 className="text-sm font-semibold text-stone-200">Invitaciones pendientes</h3>
          {invitations.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">No hay invitaciones pendientes.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/5">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <p className="text-sm text-stone-300">
                    {invitation.email}
                    <span className="ml-2 text-xs text-stone-500">
                      {WORKSPACE_ROLES[invitation.role] ?? invitation.role}
                    </span>
                  </p>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => revokeInvitation(invitation.id)}
                    className="text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-50"
                  >
                    Revocar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={onInvite} className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
            <label className="block text-sm text-stone-300">
              Email
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="compañera@estudio.es"
              />
            </label>
            <label className="block text-sm text-stone-300">
              Rol
              <Select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                options={[
                  { value: "member", label: "Miembro" },
                  { value: "admin", label: "Administrador" },
                ]}
              />
            </label>
            <div className="flex items-end">
              <Button disabled={submitting}>{submitting ? "Enviando…" : "Invitar"}</Button>
            </div>
          </form>
          {lastToken ? (
            <p className="mt-3 rounded-lg border border-amber-200/20 bg-amber-200/5 p-3 text-xs leading-5 text-amber-100">
              Comparte este código con la persona invitada (se muestra una sola vez):
              <span className="mt-1 block break-all font-mono">{lastToken}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {!loading && !error ? (
        <form onSubmit={onAccept} className="mt-5 grid gap-3 border-t border-white/5 pt-5 sm:grid-cols-[1fr_auto]">
          <label className="block text-sm text-stone-300">
            ¿Tienes un código de invitación? Pégalo aquí
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Código de invitación"
            />
          </label>
          <div className="flex items-end">
            <Button disabled={submitting || !token.trim()}>
              {submitting ? "Uniendo…" : "Unirme"}
            </Button>
          </div>
        </form>
      ) : null}
    </Panel>
  );
}
