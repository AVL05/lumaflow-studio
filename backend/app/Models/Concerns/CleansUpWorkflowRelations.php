<?php

namespace App\Models\Concerns;

use App\Models\Activity;
use App\Models\Reminder;

/**
 * Las relaciones morficas (activities, reminders) no tienen clave foranea,
 * asi que al eliminar el sujeto hay que limpiarlas explicitamente para no
 * dejar registros huerfanos en el feed de actividad ni en el calendario.
 */
trait CleansUpWorkflowRelations
{
    protected static function bootCleansUpWorkflowRelations(): void
    {
        static::deleting(function ($model): void {
            $morphClass = $model->getMorphClass();

            Activity::query()
                ->where('subject_type', $morphClass)
                ->where('subject_id', $model->getKey())
                ->delete();

            Reminder::query()
                ->where('remindable_type', $morphClass)
                ->where('remindable_id', $model->getKey())
                ->delete();
        });
    }
}
