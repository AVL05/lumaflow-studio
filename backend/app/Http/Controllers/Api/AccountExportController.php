<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccountExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountExportController extends Controller
{
    public function __invoke(Request $request, AccountExportService $exports): JsonResponse
    {
        return response()->json(
            $exports->build($request->user()),
            200,
            ['Content-Disposition' => 'attachment; filename="lumaflow-datos-'.now()->format('Ymd-His').'.json"'],
        );
    }
}
