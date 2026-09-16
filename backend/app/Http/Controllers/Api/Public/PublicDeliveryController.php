<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\DeliveryChangesRequest;
use App\Http\Resources\PublicDeliveryResource;
use App\Models\Delivery;
use App\Services\NotificationService;

class PublicDeliveryController extends Controller
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function show(string $token): PublicDeliveryResource
    {
        $delivery = $this->find($token);

        return new PublicDeliveryResource($delivery);
    }

    public function approve(string $token): PublicDeliveryResource
    {
        $delivery = $this->find($token);
        $delivery->update(['status' => 'approved', 'client_responded_at' => now()]);

        $this->notifications->success(
            $delivery->user,
            'Entrega aprobada por el cliente',
            $delivery->title,
            "/app/deliveries/{$delivery->id}",
        );

        return new PublicDeliveryResource($delivery->fresh());
    }

    public function requestChanges(DeliveryChangesRequest $request, string $token): PublicDeliveryResource
    {
        $delivery = $this->find($token);
        $delivery->update([
            'client_message' => $request->validated('message'),
            'client_responded_at' => now(),
        ]);

        $this->notifications->warning(
            $delivery->user,
            'El cliente ha pedido cambios',
            $delivery->title,
            "/app/deliveries/{$delivery->id}",
        );

        return new PublicDeliveryResource($delivery->fresh());
    }

    private function find(string $token): Delivery
    {
        return Delivery::query()->where('public_token', $token)->with(['user', 'client', 'session'])->firstOrFail();
    }
}
