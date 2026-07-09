<?php

namespace App\Models\Concerns;

use App\Models\Activity;

/**
 * La relacion morfica activities no tiene clave foranea, asi que al
 * eliminar el sujeto hay que limpiarla explicitamente para no dejar
 * registros huerfanos en el feed de actividad.
 */
trait CleansUpWorkflowRelations
{
    protected static function bootCleansUpWorkflowRelations(): void
    {
        static::deleting(function ($model): void {
            Activity::query()
                ->where('subject_type', $model->getMorphClass())
                ->where('subject_id', $model->getKey())
                ->delete();
        });
    }
}
