<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Gate;

abstract class Controller
{
    /**
     * Autoriza via policy pero responde 404 en lugar de 403 para no filtrar
     * la existencia de recursos ajenos, igual que ensureOwnership() en los
     * controladores previos a la fase 9.
     */
    protected function authorizeOwnership(string $ability, mixed $model): void
    {
        abort_unless(Gate::allows($ability, $model), 404);
    }
}
