<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceMembership;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Invitaciones seguras al estudio (Issue #5).
 *
 * El token plano se genera con entropia criptografica y solo se muestra una
 * vez al invitar; en base de datos queda su hash SHA-256. Nunca se registra
 * en logs. Una invitacion aceptada o revocada no puede reutilizarse.
 */
class WorkspaceInvitationService
{
    /**
     * @return array{invitation: WorkspaceInvitation, token: string}
     */
    public function invite(User $inviter, int $workspaceId, string $email, string $role): array
    {
        $authorizer = app(WorkspaceAuthorizer::class);

        abort_unless($authorizer->isMember($inviter, $workspaceId), 404);
        abort_unless($authorizer->canInvite($inviter, $workspaceId, $role), 403);

        $email = strtolower(trim($email));

        abort_unless(in_array($role, [WorkspaceMembership::ROLE_ADMIN, WorkspaceMembership::ROLE_MEMBER], true), 422);

        return DB::transaction(function () use ($inviter, $workspaceId, $email, $role): array {
            $token = Str::random(64);

            $invitation = WorkspaceInvitation::query()->updateOrCreate(
                [
                    'workspace_id' => $workspaceId,
                    'email' => $email,
                    'status' => WorkspaceInvitation::STATUS_PENDING,
                ],
                [
                    'role' => $role,
                    'token_hash' => hash('sha256', $token),
                    'expires_at' => now()->addDays(WorkspaceInvitation::TTL_DAYS),
                    'invited_by' => $inviter->getKey(),
                    'accepted_by' => null,
                    'accepted_at' => null,
                ]
            );

            return ['invitation' => $invitation->refresh(), 'token' => $token];
        });
    }

    public function accept(User $user, string $plainToken): WorkspaceMembership
    {
        $invitation = WorkspaceInvitation::query()
            ->where('token_hash', hash('sha256', trim($plainToken)))
            ->first();

        abort_if(! $invitation instanceof WorkspaceInvitation, 404);

        return DB::transaction(function () use ($user, $invitation): WorkspaceMembership {
            $invitation->refresh();

            if ($invitation->getAttribute('status') === WorkspaceInvitation::STATUS_ACCEPTED) {
                throw ValidationException::withMessages(['token' => 'Esta invitación ya fue utilizada.']);
            }

            if ($invitation->getAttribute('status') === WorkspaceInvitation::STATUS_REVOKED) {
                throw ValidationException::withMessages(['token' => 'Esta invitación fue revocada.']);
            }

            if ($invitation->getAttribute('status') !== WorkspaceInvitation::STATUS_PENDING
                || ! $invitation->isUsable()) {
                $invitation->forceFill(['status' => WorkspaceInvitation::STATUS_EXPIRED])->saveQuietly();

                throw ValidationException::withMessages(['token' => 'Esta invitación ha caducado.']);
            }

            if (strtolower(trim((string) $user->getAttribute('email'))) !== strtolower(trim((string) $invitation->getAttribute('email')))) {
                abort(403, 'Esta invitación corresponde a otro email.');
            }

            $membership = WorkspaceMembership::query()->firstOrCreate(
                ['workspace_id' => $invitation->getAttribute('workspace_id'), 'user_id' => $user->getKey()],
                ['role' => $invitation->getAttribute('role')]
            );

            $invitation->forceFill([
                'status' => WorkspaceInvitation::STATUS_ACCEPTED,
                'accepted_by' => $user->getKey(),
                'accepted_at' => now(),
            ])->saveQuietly();

            // Tras unirse, se empieza a trabajar en el nuevo estudio.
            $user->forceFill(['current_workspace_id' => $invitation->getAttribute('workspace_id')])->saveQuietly();

            return $membership->refresh();
        });
    }

    public function revoke(User $user, int $invitationId): void
    {
        $authorizer = app(WorkspaceAuthorizer::class);

        $invitation = WorkspaceInvitation::query()
            ->whereIn('workspace_id', $authorizer->workspaceIds($user))
            ->findOrFail($invitationId);

        abort_unless($authorizer->canRevoke($user, (int) $invitation->getAttribute('workspace_id')), 403);

        if ($invitation->getAttribute('status') !== WorkspaceInvitation::STATUS_PENDING) {
            throw ValidationException::withMessages(['invitation' => 'Solo se pueden revocar invitaciones pendientes.']);
        }

        $invitation->forceFill(['status' => WorkspaceInvitation::STATUS_REVOKED])->saveQuietly();
    }
}
