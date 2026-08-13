<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\OnboardingRequest;
use App\Http\Resources\UserResource;
use App\Services\OnboardingService;
use App\Support\AuditLog;

class OnboardingController extends Controller
{
    public function __invoke(OnboardingRequest $request, OnboardingService $onboarding): UserResource
    {
        $user = $onboarding->complete($request->user(), $request->validated());
        AuditLog::onboardingCompleted($user->id);

        return new UserResource($user);
    }
}
