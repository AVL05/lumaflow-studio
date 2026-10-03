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
        $sessionsByStatus = Session::query()
            ->accessibleBy($user)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'totalSessions' => Session::query()->accessibleBy($user)->count(),
            'upcomingSessions' => Session::query()
                ->accessibleBy($user)
                ->where('date', '>=', now()->toDateString())
                ->orderBy('date')
                ->orderBy('time')
                ->limit(6)
                ->get(),
            'sessionsByStatus' => $this->statusTotals($sessionsByStatus),
            'totalGear' => GearItem::query()->accessibleBy($user)->count(),
            'totalLocations' => Location::query()->accessibleBy($user)->count(),
            'totalClients' => Client::query()->accessibleBy($user)->count(),
            'activeClients' => Client::query()->accessibleBy($user)->where('status', 'active')->count(),
            'pendingDeliveries' => Delivery::query()->accessibleBy($user)->where('status', 'pending')->count(),
            'deliveredProjects' => Delivery::query()->accessibleBy($user)->whereIn('status', ['delivered', 'approved'])->count(),
            'latestLocations' => Location::query()
                ->accessibleBy($user)
                ->latest()
                ->limit(4)
                ->get(),
            'favoriteLocations' => Location::query()
                ->accessibleBy($user)
                ->where('is_favorite', true)
                ->withCount('sessions')
                ->orderByDesc('rating')
                ->latest()
                ->limit(4)
                ->get(),
            'topLocationCities' => Location::query()
                ->accessibleBy($user)
                ->whereNotNull('city')
                ->select('city', DB::raw('count(*) as total'))
                ->groupBy('city')
                ->orderByDesc('total')
                ->limit(5)
                ->get(),
            'upcomingSessionsWithLocation' => Session::query()
                ->accessibleBy($user)
                ->with('location')
                ->where('date', '>=', now()->toDateString())
                ->where(function ($query): void {
                    $query->whereNotNull('location_id')->orWhereNotNull('location_name');
                })
                ->orderBy('date')
                ->limit(4)
                ->get(),
            'recentClients' => Client::query()
                ->accessibleBy($user)
                ->withCount('deliveries')
                ->latest()
                ->limit(4)
                ->get(),
            'upcomingDeliveries' => Delivery::query()
                ->accessibleBy($user)
                ->with(['client', 'session'])
                ->whereNotNull('delivery_date')
                ->whereDate('delivery_date', '>=', now()->toDateString())
                ->orderBy('delivery_date')
                ->limit(4)
                ->get(),
            'latestAiAnalysis' => AiAnalysis::query()
                ->accessibleBy($user)
                ->latest()
                ->first(),
            'ollamaStatus' => $this->ollama->status(),
            'latestAiRecommendations' => AiAnalysis::query()
                ->accessibleBy($user)
                ->latest()
                ->limit(3)
                ->get()
                ->map(fn (AiAnalysis $analysis) => [
                    'summary' => $analysis->summary,
                    'score' => $analysis->score,
                    'created_at' => $analysis->created_at?->toISOString(),
                ]),
            'aiUsage' => [
                'conversations' => AiConversation::query()->accessibleBy($user)->count(),
                'analyses' => AiAnalysis::query()->accessibleBy($user)->count(),
                'sessionPlans' => AiSessionPlan::query()->accessibleBy($user)->count(),
                'optimizedSessions' => AiSessionPlan::query()->accessibleBy($user)->distinct()->count('session_id'),
            ],
            'latestAiSessionPlans' => AiSessionPlan::query()
                ->accessibleBy($user)
                ->with('session')
                ->latest()
                ->limit(3)
                ->get(),
            'todayAgenda' => $this->calendar->events($user, now()->toDateString(), now()->toDateString()),
            'pendingTasks' => Task::query()
                ->accessibleBy($user)
                ->open()
                ->with(['session:id,name', 'client:id,name'])
                ->orderByRaw('due_date is null')
                ->orderBy('due_date')
                ->limit(6)
                ->get(),
            'taskSummary' => $this->taskSummary->forUser($user),
            'unreadNotifications' => Notification::query()->ownedBy($user->id)->unread()->count(),
            'monthlyProgress' => $this->monthlyProgress($user),
            'favoriteGear' => GearItem::query()
                ->accessibleBy($user)
                ->where('is_favorite', true)
                ->orderBy('category')
                ->limit(6)
                ->get(),
            'timeline' => Activity::query()
                ->accessibleBy($user)
                ->latest()
                ->limit(8)
                ->get(),
            'activation' => $this->activation->forUser($user),
        ];
    }

    private function monthlyProgress(User $user): array
    {
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();

        $sessions = Session::query()->accessibleBy($user)->whereBetween('date', [$start, $end]);
        $total = (clone $sessions)->count();
        $completed = (clone $sessions)->whereIn('status', ['completed', 'delivered'])->count();

        return [
            'month' => now()->format('Y-m'),
            'sessions' => $total,
            'completedSessions' => $completed,
            'completionRate' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            'deliveries' => Delivery::query()->accessibleBy($user)->whereBetween('delivery_date', [$start, $end])->count(),
            'completedTasks' => Task::query()->accessibleBy($user)->where('status', 'completed')->whereBetween('completed_at', [$start, $end])->count(),
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
