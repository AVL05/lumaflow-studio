<?php

namespace App\Services;

use App\Models\Delivery;
use Illuminate\Database\Eloquent\Builder;

class PublicDeliveryService
{
    public function resolve(string $token): Delivery
    {
        $delivery = $this->usable()->where('public_token', $token)->with(['user', 'client', 'session'])->firstOrFail();
        if ($delivery->gallery_url) {
            $url = parse_url($delivery->gallery_url);
            abort_unless($url && isset($url['host']) && in_array(strtolower($url['scheme'] ?? ''), ['http', 'https'], true) && ! isset($url['user']) && ! isset($url['pass']), 404);
        }

        return $delivery;
    }

    private function usable(): Builder
    {
        return Delivery::query()->whereIn('status', ['pending', 'delivered', 'approved'])->whereNull('portal_revoked_at')
            ->where(fn ($query) => $query->whereNull('gallery_expires_at')->orWhere('gallery_expires_at', '>=', today()->toDateString()));
    }

    public function approve(Delivery $delivery, array $data = []): Delivery
    {
        return app(DeliveryRevisionService::class)->respond($delivery, 'approve', $data);
    }

    public function requestChanges(Delivery $delivery, string $message, array $data = []): Delivery
    {
        return app(DeliveryRevisionService::class)->respond($delivery, 'request-changes', [...$data, 'message' => $message]);
    }
}
