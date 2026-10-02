<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Estudio personal de cada usuario (Issue #4).
 *
 * Un workspace por usuario en esta fase: sin invitaciones, roles ni selector.
 * La creacion es idempotente y segura para llamar desde observadores,
 * migraciones y tests.
 */
class WorkspaceService
{
    public function ensureForUser(User $user): Workspace
    {
        $currentId = $user->getAttribute('current_workspace_id');

        if ($currentId) {
            $current = Workspace::query()->find($currentId);

            if ($current instanceof Workspace) {
                return $current;
            }
        }

        $owned = Workspace::query()->where('user_id', $user->getKey())->first();

        if ($owned instanceof Workspace) {
            $this->pointUserToWorkspace($user, $owned);

            return $owned;
        }

        return DB::transaction(function () use ($user): Workspace {
            $name = $user->getAttribute('studio_name') ?: $user->getAttribute('name') ?: 'Mi estudio';
            $slug = $this->uniqueSlug($user->getAttribute('studio_slug') ?: $name);

            $workspace = Workspace::query()->create([
                'user_id' => $user->getKey(),
                'name' => $name,
                'slug' => $slug,
            ]);

            $this->pointUserToWorkspace($user, $workspace);

            return $workspace;
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
