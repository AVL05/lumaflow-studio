<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Estudio de cada usuario y coherencia de memberships (Issues #4 y #5).
 *
 * La creacion es idempotente y segura para llamar desde observadores,
 * migraciones y tests. Todo workspace funcional conserva un owner.
 */
class WorkspaceService
{
    public function ensureForUser(User $user): Workspace
    {
        $currentId = $user->getAttribute('current_workspace_id');

        if ($currentId) {
            $current = Workspace::query()->find($currentId);

            if ($current instanceof Workspace) {
                $this->ensureOwnerMembership($current);
                $this->ensureCurrentWorkspace($user->refresh());

                return $current->refresh();
            }
        }

        $owned = Workspace::query()->where('user_id', $user->getKey())->first();

        if ($owned instanceof Workspace) {
            $this->pointUserToWorkspace($user, $owned);
            $this->ensureOwnerMembership($owned);

            return $owned;
        }

        $workspace = DB::transaction(function () use ($user): Workspace {
            $name = $user->getAttribute('studio_name') ?: $user->getAttribute('name') ?: 'Mi estudio';
            $slug = $this->uniqueSlug($user->getAttribute('studio_slug') ?: $name);

            $created = Workspace::query()->create([
                'user_id' => $user->getKey(),
                'name' => $name,
                'slug' => $slug,
            ]);

            $this->pointUserToWorkspace($user, $created);
            $this->ensureOwnerMembership($created);

            return $created;
        });

        return $workspace;
    }

    /**
     * El propietario registrado queda representado como membership `owner`.
     * Garantiza que no exista un workspace funcional sin owner valido.
     */
    public function ensureOwnerMembership(Workspace $workspace): WorkspaceMembership
    {
        return WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->getKey(), 'user_id' => $workspace->user_id],
            ['role' => WorkspaceMembership::ROLE_OWNER]
        );
    }

    /**
     * `current_workspace_id` debe apuntar siempre a un workspace con
     * membership. Si la membership actual se perdio, se selecciona otra
     * valida o se deja a null de forma coherente.
     */
    public function ensureCurrentWorkspace(User $user): ?Workspace
    {
        $authorizer = app(WorkspaceAuthorizer::class);
        $currentId = (int) ($user->getAttribute('current_workspace_id') ?? 0);

        if ($currentId && $authorizer->isMember($user, $currentId)) {
            return Workspace::query()->find($currentId);
        }

        $fallbackId = WorkspaceMembership::query()
            ->where('user_id', $user->getKey())
            ->orderBy('id')
            ->value('workspace_id');

        $user->forceFill(['current_workspace_id' => $fallbackId ? (int) $fallbackId : null])->saveQuietly();

        return $fallbackId ? Workspace::query()->find($fallbackId) : null;
    }

    /**
     * Retira una membership: corta el acceso de inmediato y repara el
     * workspace actual del afectado si apuntaba al workspace perdido.
     */
    public function removeMembership(WorkspaceMembership $membership): void
    {
        DB::transaction(function () use ($membership): void {
            $userId = (int) $membership->getAttribute('user_id');
            $membership->delete();

            $user = User::query()->find($userId);

            if ($user instanceof User) {
                $this->ensureCurrentWorkspace($user);
            }
        });
    }

    private function pointUserToWorkspace(User $user, Workspace $workspace): void
    {
        if ((int) $user->getAttribute('current_workspace_id') !== (int) $workspace->getKey()) {
            $user->forceFill(['current_workspace_id' => $workspace->getKey()])->saveQuietly();
        }
    }

    private function uniqueSlug(string $seed): string
    {
        $base = Str::slug($seed) ?: 'estudio';
        $slug = $base;
        $suffix = 1;

        while (Workspace::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}
