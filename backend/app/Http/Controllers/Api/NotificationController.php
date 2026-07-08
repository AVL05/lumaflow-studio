<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function index(): AnonymousResourceCollection
    {
        $notifications = Notification::query()
            ->ownedBy(request()->user()->id)
            ->type(request('type'))
            ->when(request('unread') === '1', fn ($query) => $query->unread())
            ->latest()
            ->paginate(min((int) request('per_page', 20), 60));

        // Clave de primer nivel: sobrescribir "meta" romperia la paginacion del recurso.
        return NotificationResource::collection($notifications)->additional([
            'unread' => $this->notifications->unreadCount(request()->user()),
        ]);
    }

    public function unreadCount(): JsonResponse
    {
        return response()->json(['unread' => $this->notifications->unreadCount(request()->user())]);
    }

    public function markRead(Notification $notification): NotificationResource
    {
        $this->authorizeOwnership('update', $notification);
        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return new NotificationResource($notification->refresh());
    }

    public function markAllRead(): JsonResponse
    {
        $updated = Notification::query()
            ->ownedBy(request()->user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['updated' => $updated, 'unread' => 0]);
    }

    public function destroy(Notification $notification): mixed
    {
        $this->authorizeOwnership('delete', $notification);
        $notification->delete();

        return response()->noContent();
    }

    public function clear(): JsonResponse
    {
        $deleted = Notification::query()
            ->ownedBy(request()->user()->id)
            ->when(request('only') === 'read', fn ($query) => $query->whereNotNull('read_at'))
            ->delete();

        return response()->json(['deleted' => $deleted]);
    }
}
