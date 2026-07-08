<?php

namespace App\Policies;

use App\Models\ChecklistItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ChecklistItemPolicy extends OwnedResourcePolicy
{
    /** ChecklistItem no guarda user_id: la propiedad se hereda del checklist. */
    protected function owns(User $user, Model $model): bool
    {
        /** @var ChecklistItem $model */
        return (int) $model->checklist?->user_id === $user->id;
    }
}
