<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientImportRequest;
use App\Services\ClientImportService;
use Illuminate\Http\JsonResponse;

class ClientImportController extends Controller
{
    public function __invoke(ClientImportRequest $request, ClientImportService $service): JsonResponse
    {
        return response()->json([
            'data' => $service->import($request->user(), $request->validated('clients')),
        ]);
    }
}
