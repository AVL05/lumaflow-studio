<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\AiAnalysis;
use App\Models\AiConversation;
use App\Models\AiSessionPlan;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Location;
use App\Models\Notification;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function __construct(
        private readonly OllamaService $ollama,
        private readonly CalendarService $calendar,
        private readonly TaskSummaryService $taskSummary,
        private readonly ActivationService $activation,
    ) {}

    public function forUser(User $user): array
    {
        $counts = User::query()
            ->whereKey($user->id)
            ->withCount(['sessions', 'gearItems', 'locations', 'clients', 'deliveries'])
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
            'totalGear' => $counts->gear_items_count,
            'totalLocations' => $counts->locations_count,
            'totalClients' => $counts->clients_count,
            'activeClients' => Client::query()->ownedBy($user->id)->where('status', 'active')->count(),
            'pendingDeliveries' => Delivery::query()->ownedBy($user->id)->where('status', 'pending')->count(),
            'deliveredProjects' => Delivery::query()->ownedBy($user->id)->whereIn('status', ['delivered', 'approved'])->count(),
            'latestLocations' => Location::query()
                ->ownedBy($user->id)
                ->latest()
                ->limit(4)
                ->get(),
            'favoriteLocations' => Location::query()
                ->ownedBy($user->id)
                ->where('is_favorite', true)
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
                'sessionPlans' => AiSessionPlan::query()->ownedBy($user->id)->count(),
                'optimizedSessions' => AiSessionPlan::query()->ownedBy($user->id)->distinct()->count('session_id'),
            ],
            'latestAiSessionPlans' => AiSessionPlan::query()
                ->ownedBy($user->id)
                ->with('session')
                ->latest()
                ->limit(3)
                ->get(),
            'todayAgenda' => $this->calendar->events($user, now()->toDateString(), now()->toDateString()),
            'pendingTasks' => Task::query()
                ->ownedBy($user->id)
                ->open()
                ->with(['session:id,name', 'client:id,name'])
                ->orderByRaw('due_date is null')
                ->orderBy('due_date')
                ->limit(6)
                ->get(),
            'taskSummary' => $this->taskSummary->forUser($user->id),
            'unreadNotifications' => Notification::query()->ownedBy($user->id)->unread()->count(),
            'monthlyProgress' => $this->monthlyProgress($user->id),
            'favoriteGear' => GearItem::query()
                ->ownedBy($user->id)
                ->where('is_favorite', true)
                ->orderBy('category')
                ->limit(6)
                ->get(),
            'timeline' => Activity::query()
                ->ownedBy($user->id)
                ->latest()
                ->limit(8)
                ->get(),
            'activation' => $this->activation->forUser($user),
        ];
    }

    private function monthlyProgress(int $userId): array
    {
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();

        $sessions = Session::query()->ownedBy($userId)->whereBetween('date', [$start, $end]);
        $total = (clone $sessions)->count();
        $completed = (clone $sessions)->whereIn('status', ['completed', 'delivered'])->count();

        return [
            'month' => now()->format('Y-m'),
            'sessions' => $total,
            'completedSessions' => $completed,
            'completionRate' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            'deliveries' => Delivery::query()->ownedBy($userId)->whereBetween('delivery_date', [$start, $end])->count(),
            'completedTasks' => Task::query()->ownedBy($userId)->where('status', 'completed')->whereBetween('completed_at', [$start, $end])->count(),
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
}
