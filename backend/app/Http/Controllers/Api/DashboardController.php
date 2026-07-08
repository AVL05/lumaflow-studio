<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardResource;
use App\Services\DashboardService;

class DashboardController extends Controller
{
    public function __invoke(DashboardService $dashboard): DashboardResource
    {
        return new DashboardResource($dashboard->forUser(request()->user()));
    }
}
