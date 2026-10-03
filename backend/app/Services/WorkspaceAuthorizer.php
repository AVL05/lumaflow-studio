<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkspaceMembership;
use Illuminate\Database\Eloquent\Model;

/**
 * Unica fuente para responder a la autorizacion por workspace (Issue #5).
 *
 * Regla fundamental: un usuario accede a los recursos de un workspace solo
 * si tiene una membership valida en ese workspace. `user_id` se conserva
 * como creador/compatibilidad, pero ya no es la frontera.
 */
class WorkspaceAuthorizer
{
    /** @return int[] */
    public function workspaceIds(User $user): array
    {
        return WorkspaceMembership::query()
            ->where('user_id', $user->getKey())
            ->pluck('workspace_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function isMember(User $user, ?int $workspaceId): bool
    {
        if (! $workspaceId) {
            return false;
        }

        return in_array($workspaceId, $this->workspaceIds($user), true);
    }

    public function role(User $user, ?int $workspaceId): ?string
    {
        if (! $workspaceId) {
            return null;
        }

        return WorkspaceMembership::query()
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $user->getKey())
            ->value('role');
    }

    /**
     * ¿Puede operar con este recurso? Comprueba el workspace del recurso,
     * no quien lo creo. Con `workspace_id` nulo (legado) se recurre a la
     * igualdad de `user_id` para no bloquear datos aun sin backfill.
     */
    public function canAccess(User $user, mixed $resource): bool
    {
        if (! is_object($resource)) {
            return false;
        }

        $workspaceId = (int) ($resource->getAttribute('workspace_id') ?? 0);

        if ($workspaceId) {
            return $this->isMember($user, $workspaceId);
        }

        return (int) ($resource->getAttribute('user_id') ?? 0) === (int) $user->getKey();
    }

    public function requireAccessOr404(User $user, mixed $resource): void
    {
        abort_unless($this->canAccess($user, $resource), 404);
    }

    /**
     * Busca un recurso solo dentro de los workspaces del usuario.
     * Responde 404 sin filtrar existencia ajena.
     *
     * @param  class-string<Model>  $model
     */
    public function findOrFail(string $model, User $user, int $id): mixed
    {
        return $model::query()->whereIn('workspace_id', $this->workspaceIds($user))->findOrFail($id);
    }

    /**
     * ¿Puede invitar con ese rol? Owner invita admin/member; admin solo member.
     * Nadie invita owner: el owner inicial lo crea el backfill/registro.
     */
    public function canInvite(User $user, int $workspaceId, string $role): bool
    {
        $own = $this->role($user, $workspaceId);

        if ($own === WorkspaceMembership::ROLE_OWNER) {
            return in_array($role, [WorkspaceMembership::ROLE_ADMIN, WorkspaceMembership::ROLE_MEMBER], true);
        }

        if ($own === WorkspaceMembership::ROLE_ADMIN) {
            return $role === WorkspaceMembership::ROLE_MEMBER;
        }

        return false;
    }

    public function canRevoke(User $user, int $workspaceId): bool
    {
        return in_array(
            $this->role($user, $workspaceId),
            [WorkspaceMembership::ROLE_OWNER, WorkspaceMembership::ROLE_ADMIN],
            true
        );
    }

    /**
     * ¿Puede retirar a ese miembro? Owner retira admin/member (nunca a si
     * mismo si es el unico owner); admin solo retira member; member nada.
     */
    public function canRemove(User $user, int $workspaceId, WorkspaceMembership $target): bool
    {
        if ((int) $target->getAttribute('workspace_id') !== $workspaceId) {
            return false;
        }

        $own = $this->role($user, $workspaceId);

        if ($own === WorkspaceMembership::ROLE_OWNER) {
            if ($target->getAttribute('role') === WorkspaceMembership::ROLE_OWNER) {
                return $this->ownerCount($workspaceId) > 1
                    && (int) $target->getAttribute('user_id') !== (int) $user->getKey();
            }

            return true;
        }

        if ($own === WorkspaceMembership::ROLE_ADMIN) {
            return $target->getAttribute('role') === WorkspaceMembership::ROLE_MEMBER;
        }

        return false;
    }

    public function ownerCount(int $workspaceId): int
    {
        return WorkspaceMembership::query()
            ->where('workspace_id', $workspaceId)
            ->where('role', WorkspaceMembership::ROLE_OWNER)
            ->count();
    }
}
