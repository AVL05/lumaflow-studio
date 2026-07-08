<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HealthService;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /** Sonda publica para orquestadores. 200 si esta operativo, 503 si no. */
    public function __invoke(HealthService $health): JsonResponse
    {
        $summary = $health->summary();

        return response()->json($summary, $summary['status'] === 'down' ? 503 : 200);
    }
}
