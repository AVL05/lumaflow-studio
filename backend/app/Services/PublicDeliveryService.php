<?php

namespace App\Services;

use App\Models\Delivery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class PublicDeliveryService
{
    public function __construct(private readonly NotificationService $notifications, private readonly ActivityLogger $activity) {}

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
        return Delivery::query()->whereIn('status', ['pending', 'delivered', 'approved'])
            ->where(fn ($query) => $query->whereNull('gallery_expires_at')->orWhere('gallery_expires_at', '>=', today()->toDateString()));
    }

    public function approve(Delivery $delivery): Delivery
    {
        return DB::transaction(function () use ($delivery): Delivery {
            // Escribir antes de leer evita upgrades de locks SQLite; CAS sirve también en MySQL.
            foreach (['pending', 'delivered'] as $from) {
                $changed = $this->usable()->whereKey($delivery->id)->where('public_token', $delivery->public_token)
                    ->where('status', $from)->update(['status' => 'approved', 'client_responded_at' => now()]);
                if ($changed) {
                    break;
                }
            }
            $current = $this->resolve($delivery->public_token);
            if ($changed) {
                $this->activity->logStatusChange($current->user, $current, $from, 'approved');
                $this->notifications->success($current->user, 'Entrega aprobada por el cliente', $current->title, "/app/deliveries/{$current->id}");
                AnalyticsCache::flushForWorkspace($current->workspace_id);
            }

            return $current;
        }, 3);
    }

    public function requestChanges(Delivery $delivery, string $message): Delivery
    {
        $message = trim(strip_tags($message));
        abort_if($message === '', 422, 'El comentario no puede estar vacío.');

        return DB::transaction(function () use ($delivery, $message): Delivery {
            $changed = $this->usable()->whereKey($delivery->id)->where('public_token', $delivery->public_token)
                ->whereIn('status', ['pending', 'delivered'])->where('client_message', $delivery->client_message)
                ->where(fn ($query) => $query->whereNull('client_message')->orWhere('client_message', '!=', $message))
                ->update(['client_message' => $message, 'client_responded_at' => now()]);
            $current = $this->resolve($delivery->public_token);
            abort_if($current->status === 'approved', 422, 'La entrega ya está aprobada.');
            if (! $changed) {
                abort_if($current->client_message !== $message, 409, 'La entrega ha cambiado. Vuelve a cargarla.');

                return $current;
            }
            $this->activity->log($current->user, $current, ActivityLogger::COMMENT, $message);
            $this->notifications->warning($current->user, 'El cliente ha pedido cambios', $current->title, "/app/deliveries/{$current->id}");

            return $current;
        }, 3);
    }
}
