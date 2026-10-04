<?php

namespace App\Observers;

use App\Services\AnalyticsCache;
use Illuminate\Database\Eloquent\Model;

/**
 * Invalida analytics al mutar entidades que alimentan KPIs (Issue #9).
 *
 * Sincrono a proposito: el peor caso tras un rollback es una cache fria
 * (recalculo), nunca datos incorrectos servidos. La ventana de carrera
 * recalcula/muta queda acotada por el TTL y documentada.
 */
class AnalyticsInvalidationObserver
{
    public function saved(Model $model): void
    {
        $this->flush($model);
    }

    public function deleted(Model $model): void
    {
        $this->flush($model);
    }

    private function flush(Model $model): void
    {
        AnalyticsCache::flushForWorkspace((int) ($model->getAttribute('workspace_id') ?? 0));

        $original = (int) ($model->getOriginal('workspace_id') ?? 0);

        if ($original && $original !== (int) ($model->getAttribute('workspace_id') ?? 0)) {
            AnalyticsCache::flushForWorkspace($original);
        }
    }
}
