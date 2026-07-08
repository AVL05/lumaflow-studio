<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsRequest;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function __invoke(AnalyticsRequest $request, AnalyticsService $analytics): JsonResponse
    {
        return response()->json([
            'data' => $analytics->forUser(
                $request->user(),
                $request->validated('from'),
                $request->validated('to'),
            ),
        ]);
    }
}
