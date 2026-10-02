<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ReadyController extends Controller
{
    /** Sonda de readiness para orquestadores (solo si la app responde). */
    public function __invoke(): JsonResponse
    {
        return response()->json(['status' => 'ready'], 200);
    }
}
