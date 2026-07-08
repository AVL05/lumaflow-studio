<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HealthService;
use Illuminate\Http\JsonResponse;

class SystemController extends Controller
{
    /** Detalle para la pagina interna /app/system. Requiere sesion. */
    public function __invoke(HealthService $health): JsonResponse
    {
        return response()->json(['data' => $health->detailed()]);
    }
}
