<?php

namespace App\Services;

use App\Models\AiAnalysis;
use App\Models\AiConversation;
use App\Models\AiSessionPlan;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Location;
use App\Models\Photo;
use App\Models\Preset;
use App\Models\Session;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function __construct(private readonly OllamaService $ollama) {}

    public function forUser(User $user): array
    {
        $counts = User::query()
            ->whereKey($user->id)
            ->withCount(['sessions', 'photos', 'gearItems', 'presets', 'tags', 'locations', 'clients', 'deliveries'])
            ->firstOrFail();

        $sessionsByStatus = Session::query()
            ->ownedBy($user->id)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'totalSessions' => $counts->sessions_count,
            'upcomingSessions' => Session::query()
                ->ownedBy($user->id)
                ->where('date', '>=', now()->toDateString())
                ->orderBy('date')
                ->orderBy('time')
                ->limit(6)
                ->get(),
            'sessionsByStatus' => $this->statusTotals($sessionsByStatus),
            'totalPhotos' => $counts->photos_count,
            'totalGear' => $counts->gear_items_count,
            'totalPresets' => $counts->presets_count,
            'totalTags' => $counts->tags_count,
            'totalLocations' => $counts->locations_count,
            'totalClients' => $counts->clients_count,
            'activeClients' => Client::query()->ownedBy($user->id)->where('status', 'active')->count(),
            'pendingDeliveries' => Delivery::query()->ownedBy($user->id)->where('status', 'pending')->count(),
            'deliveredProjects' => Delivery::query()->ownedBy($user->id)->whereIn('status', ['delivered', 'approved'])->count(),
            'topPresets' => Preset::query()
                ->ownedBy($user->id)
                ->orderByDesc('usage_count')
                ->orderByDesc('is_favorite')
                ->limit(4)
                ->get(),
            'latestAlbums' => $user->albums()
                ->with('coverPhoto')
                ->withCount('photos')
                ->latest()
                ->limit(4)
                ->get(),
            'latestLocations' => Location::query()
                ->ownedBy($user->id)
                ->with('coverPhoto')
                ->latest()
                ->limit(4)
                ->get(),
            'favoriteLocations' => Location::query()
                ->ownedBy($user->id)
                ->where('is_favorite', true)
                ->with('coverPhoto')
                ->withCount('sessions')
                ->orderByDesc('rating')
                ->latest()
                ->limit(4)
                ->get(),
            'topLocationCities' => Location::query()
                ->ownedBy($user->id)
                ->whereNotNull('city')
                ->select('city', DB::raw('count(*) as total'))
                ->groupBy('city')
                ->orderByDesc('total')
                ->limit(5)
                ->get(),
            'upcomingSessionsWithLocation' => Session::query()
                ->ownedBy($user->id)
                ->with('location')
                ->where('date', '>=', now()->toDateString())
                ->where(function ($query): void {
                    $query->whereNotNull('location_id')->orWhereNotNull('location_name');
                })
                ->orderBy('date')
                ->limit(4)
                ->get(),
            'recentClients' => Client::query()
                ->ownedBy($user->id)
                ->withCount('deliveries')
                ->latest()
                ->limit(4)
                ->get(),
            'upcomingDeliveries' => Delivery::query()
                ->ownedBy($user->id)
                ->with(['client', 'session'])
                ->whereNotNull('delivery_date')
                ->whereDate('delivery_date', '>=', now()->toDateString())
                ->orderBy('delivery_date')
                ->limit(4)
                ->get(),
            'favoritePhotos' => Photo::query()
                ->ownedBy($user->id)
                ->where('is_favorite', true)
                ->with(['session', 'albums', 'tags'])
                ->latest()
                ->limit(6)
                ->get(),
            'exifSummary' => [
                'cameraModels' => Photo::query()->ownedBy($user->id)->whereNotNull('exif->camera_model')->distinct()->count('id'),
                'taggedPhotos' => Photo::query()->ownedBy($user->id)->whereHas('tags')->count(),
                'tags' => Tag::query()->ownedBy($user->id)->count(),
            ],
            'latestAiAnalysis' => AiAnalysis::query()
                ->where('user_id', $user->id)
                ->latest()
                ->first(),
            'ollamaStatus' => $this->ollama->status(),
            'latestAiRecommendations' => AiAnalysis::query()
                ->where('user_id', $user->id)
                ->latest()
                ->limit(3)
                ->get()
                ->map(fn (AiAnalysis $analysis) => [
                    'summary' => $analysis->summary,
                    'score' => $analysis->score,
                    'created_at' => $analysis->created_at?->toISOString(),
                ]),
            'aiUsage' => [
                'conversations' => AiConversation::query()->ownedBy($user->id)->count(),
                'analyses' => AiAnalysis::query()->where('user_id', $user->id)->count(),
                'generatedPresets' => AiAnalysis::query()->where('user_id', $user->id)->where('type', 'preset_generation')->count(),
                'sessionPlans' => AiSessionPlan::query()->ownedBy($user->id)->count(),
                'optimizedSessions' => AiSessionPlan::query()->ownedBy($user->id)->distinct()->count('session_id'),
            ],
            'latestAiSessionPlans' => AiSessionPlan::query()
                ->ownedBy($user->id)
                ->with('session')
                ->latest()
                ->limit(3)
                ->get(),
            'recentActivity' => $this->recentActivity($user->id),
        ];
    }

    private function statusTotals(Collection $totals): array
    {
        return collect(['planned', 'confirmed', 'completed', 'editing', 'delivered', 'cancelled'])
            ->map(fn (string $status) => [
                'status' => $status,
                'total' => (int) ($totals[$status] ?? 0),
            ])
            ->values()
            ->all();
    }

    private function recentActivity(int $userId): array
    {
        $sessions = Session::query()
            ->ownedBy($userId)
            ->selectRaw("'session' as type, name as title, status as meta, created_at")
            ->latest()
            ->limit(5);

        $photos = Photo::query()
            ->ownedBy($userId)
            ->selectRaw("'photo' as type, COALESCE(title, file_name, 'Foto sin titulo') as title, category as meta, created_at")
            ->latest()
            ->limit(5);

        $gear = GearItem::query()
            ->ownedBy($userId)
            ->selectRaw("'gear' as type, name as title, category as meta, created_at")
            ->latest()
            ->limit(5);

        $presets = Preset::query()
            ->where('user_id', $userId)
            ->selectRaw("'preset' as type, name as title, style as meta, created_at")
            ->latest()
            ->limit(5);

        $clients = Client::query()
            ->ownedBy($userId)
            ->selectRaw("'client' as type, name as title, status as meta, created_at")
            ->latest()
            ->limit(5);

        $deliveries = Delivery::query()
            ->ownedBy($userId)
            ->selectRaw("'delivery' as type, title, status as meta, created_at")
            ->latest()
            ->limit(5);

        return DB::query()
            ->fromSub($sessions->unionAll($photos)->unionAll($gear)->unionAll($presets)->unionAll($clients)->unionAll($deliveries), 'activity')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'type' => $item->type,
                'title' => $item->title,
                'meta' => $item->meta,
                'created_at' => $item->created_at,
            ])
            ->all();
    }
}
