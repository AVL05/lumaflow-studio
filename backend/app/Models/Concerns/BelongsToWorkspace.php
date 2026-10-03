<?php

namespace App\Models\Concerns;

use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceAuthorizer;
use App\Services\WorkspaceService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Asigna automaticamente el workspace del propietario al crear el modelo.
 *
 * Fase de transicion (Issue #4): `user_id` sigue siendo la frontera de
 * aislamiento aplicada en controladores; `workspace_id` se rellena de forma
 * consistente para preparar el corte completo en el Issue #5.
 */
trait BelongsToWorkspace
{
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function scopeInWorkspace($query, ?int $workspaceId)
    {
        return $query->when($workspaceId, fn ($builder) => $builder->where('workspace_id', $workspaceId));
    }

    /**
     * Frontera de lectura del Issue #5: solo workspaces con membership.
     * Sustituye a `ownedBy()` en listados de recursos compartidos.
     */
    public function scopeAccessibleBy($query, User $user)
    {
        return $query->whereIn('workspace_id', app(WorkspaceAuthorizer::class)->workspaceIds($user));
    }

    protected static function bootBelongsToWorkspace(): void
    {
        static::creating(function (Model $model): void {
            if ($model->getAttribute('workspace_id')) {
                return;
            }

            $userId = $model->getAttribute('user_id');

            if (! $userId) {
                return;
            }

            $user = User::query()->find($userId);

            if (! $user instanceof User) {
                return;
            }

            $workspaceId = $user->getAttribute('current_workspace_id');

            if (! $workspaceId) {
                $workspaceId = app(WorkspaceService::class)->ensureForUser($user)->getKey();
            }

            $model->setAttribute('workspace_id', $workspaceId);
        });
    }
}
