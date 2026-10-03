<?php

namespace App\Policies;

use App\Models\User;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Database\Eloquent\Model;

/**
 * Politica base para recursos del workspace (Issue #5).
 * Devuelve false en lugar de 403 explicito para que el controlador decida
 * el codigo de respuesta (el proyecto responde 404 para no filtrar existencia).
 */
abstract class OwnedResourcePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Model $model): bool
    {
        return $this->owns($user, $model);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Model $model): bool
    {
        return $this->owns($user, $model);
    }

    public function delete(User $user, Model $model): bool
    {
        return $this->owns($user, $model);
    }

    protected function owns(User $user, Model $model): bool
    {
        return app(WorkspaceAuthorizer::class)->canAccess($user, $model);
    }
}
