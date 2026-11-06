<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicDeliveryResource;
use App\Services\PublicDeliveryService;

class PublicDeliveryController extends Controller
{
    public function __construct(private readonly PublicDeliveryService $deliveries) {}

    public function show(string $token): PublicDeliveryResource
    {
        return new PublicDeliveryResource($this->deliveries->resolve($token));
    }
}
