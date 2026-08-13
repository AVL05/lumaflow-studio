<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivationService;
use App\Services\SampleWorkspaceService;
use Illuminate\Http\JsonResponse;

class ActivationController extends Controller
{
    public function enableBookings(ActivationService $activation): JsonResponse
    {
        $user = $activation->enableBookings(request()->user());

        return response()->json(['data' => $activation->forUser($user)]);
    }

    public function sampleWorkspace(SampleWorkspaceService $sample, ActivationService $activation): JsonResponse
    {
        $user = $sample->activate(request()->user());

        return response()->json(['data' => $activation->forUser($user)]);
    }
}
