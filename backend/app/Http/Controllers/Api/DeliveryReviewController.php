<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeliveryReviewRequest;
use App\Http\Resources\DeliveryResource;
use App\Http\Resources\PublicDeliveryResource;
use App\Models\Delivery;
use App\Services\DeliveryRevisionService;
use App\Services\PublicDeliveryService;
use App\Services\WorkspaceAuthorizer;

class DeliveryReviewController extends Controller
{
    public function __construct(private readonly DeliveryRevisionService $reviews) {}

    public function publish(DeliveryReviewRequest $request, Delivery $delivery): DeliveryResource
    {
        return new DeliveryResource($this->reviews->publish($delivery, $request->user(), $request->validated()));
    }

    public function portal(DeliveryReviewRequest $request, Delivery $delivery): DeliveryResource
    {
        return new DeliveryResource($this->reviews->portal($delivery, $request->user(), $request->validated()));
    }

    public function respond(DeliveryReviewRequest $request, Delivery $delivery, string $action): DeliveryResource
    {
        return new DeliveryResource($this->reviews->respond($delivery, $action, $request->validated(), $request->user()));
    }

    public function publicRespond(DeliveryReviewRequest $request, string $token, string $action): PublicDeliveryResource
    {
        return new PublicDeliveryResource($this->reviews->respond(app(PublicDeliveryService::class)->resolve($token), $action, $request->validated()));
    }

    public function history(Delivery $delivery): array
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404(request()->user(), $delivery);

        return $this->reviews->history($delivery);
    }

    public function publicHistory(string $token): array
    {
        return $this->reviews->history(app(PublicDeliveryService::class)->resolve($token), true);
    }
}
