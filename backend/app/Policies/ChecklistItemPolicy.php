<?php

namespace App\Policies;

use App\Models\ChecklistItem;
use App\Models\User;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Database\Eloquent\Model;

class ChecklistItemPolicy extends OwnedResourcePolicy
{
    /** ChecklistItem no guarda workspace: la propiedad se hereda del checklist. */
    protected function owns(User $user, Model $model): bool
    {
        /** @var ChecklistItem $model */
        $checklist = $model->checklist;

        if (! $checklist) {
            return false;
        }

        return app(WorkspaceAuthorizer::class)->canAccess($user, $checklist);
    }
}
