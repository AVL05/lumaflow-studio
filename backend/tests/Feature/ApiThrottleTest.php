<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiThrottleTest extends TestCase
{
    public function test_authenticated_group_keeps_production_default(): void
    {
        config(['api.throttle_per_minute' => 180]);

        $route = Route::getRoutes()->getByAction('App\Http\Controllers\Api\Auth\AuthController@user');

        $this->assertNotNull($route);
        $this->assertContains('throttle:180,1', $route->gatherMiddleware());
    }

    public function test_default_ceiling_protects_production(): void
    {
        // Sin API_THROTTLE_PER_MINUTE (produccion y CI de backend), el techo es 180.
        $this->assertFalse((bool) getenv('API_THROTTLE_PER_MINUTE'));
        $this->assertSame(180, config('api.throttle_per_minute'));
    }
}
