<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GettingStartedRequest;
use App\Http\Resources\UserResource;
use App\Services\GettingStartedService;

class GettingStartedController extends Controller
{
    public function __invoke(GettingStartedRequest $request, GettingStartedService $service): UserResource
    {
        return new UserResource($service->complete($request->user(), $request->validated('choice')));
    }
}
