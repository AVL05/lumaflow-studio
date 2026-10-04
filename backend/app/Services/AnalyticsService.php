<?php

namespace App\Services;

use App\Models\AiAnalysis;
use App\Models\AiConversation;
use App\Models\AiSessionPlan;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\Location;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonPeriod;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Toda la analitica se calcula con datos reales del usuario mediante
 * agregaciones en base de datos (sin cargar colecciones completas en memoria).
 * SQL especifico de MySQL, que es el unico motor soportado por el proyecto.
 */
class AnalyticsService
{
    public function forUser(User $user, ?string $from = null, ?string $to = null): array
    {
        $to = $to ? Carbon::parse($to)->endOfDay() : Carbon::now()->endOfDay();
        $from = $from ? Carbon::parse($from)->startOfDay() : $to->copy()->subMonths(11)->startOfMonth();

        // La base de datos es canonica: la cache solo evita recalcular.
        return AnalyticsCache::remember(
            $user,
            $from->toDateString(),
            $to->toDateString(),
            fn (): array => [
                'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                'kpis' => $this->kpis($user, $from, $to),
                'sessionsByMonth' => $this->sessionsByMonth($user, $from, $to),
                'sessionTypes' => $this->groupCount(Session::query()->accessibleBy($user)->whereBetween('date', [$from, $to]), 'session_type'),
                'projectStatus' => $this->groupCount(Delivery::query()->accessibleBy($user), 'status'),
                'aiUsage' => $this->aiUsage($user, $from, $to),
                'clientsByStatus' => $this->groupCount(Client::query()->accessibleBy($user), 'status'),
                'tasksByStatus' => $this->groupCount(Task::query()->accessibleBy($user), 'status'),
                'topLocations' => $this->topLocations($user),
            ]
        );
    }

    private function kpis(User $user, Carbon $from, Carbon $to): array
    {
        $sessions = Session::query()->accessibleBy($user)->whereBetween('date', [$from, $to]);
        $previousFrom = $from->copy()->subDays($from->diffInDays($to) + 1);
        $previousSessions = Session::query()->accessibleBy($user)->whereBetween('date', [$previousFrom, $from])->count();
        $currentSessions = (clone $sessions)->count();

        return [
            'sessions' => $currentSessions,
            'sessionsTrend' => $this->trend($currentSessions, $previousSessions),
            'completedSessions' => (clone $sessions)->whereIn('status', ['completed', 'delivered'])->count(),
            'revenue' => (float) Delivery::query()
                ->accessibleBy($user)
                ->whereIn('status', ['delivered', 'approved'])
                ->whereBetween('delivery_date', [$from, $to])
                ->sum('budget'),
            'pipeline' => (float) Delivery::query()
                ->accessibleBy($user)
                ->whereIn('status', ['draft', 'pending'])
                ->sum('budget'),
            'activeClients' => Client::query()->accessibleBy($user)->where('status', 'active')->count(),
            'openTasks' => Task::query()->accessibleBy($user)->open()->count(),
            'overdueTasks' => Task::query()->accessibleBy($user)->open()->whereDate('due_date', '<', now()->toDateString())->count(),
            'aiInteractions' => AiAnalysis::query()->accessibleBy($user)->whereBetween('created_at', [$from, $to])->count()
                + AiConversation::query()->accessibleBy($user)->whereBetween('created_at', [$from, $to])->count(),
        ];
    }

    private function trend(int $current, int $previous): float
    {
        if ($previous === 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function sessionsByMonth(User $user, Carbon $from, Carbon $to): array
    {
        $bucket = $this->monthBucket('date');
        $rows = Session::query()
            ->accessibleBy($user)
            ->whereBetween('date', [$from, $to])
            ->selectRaw("{$bucket} as bucket, count(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return $this->fillMonths($from, $to, $rows);
    }

    private function aiUsage(User $user, Carbon $from, Carbon $to): array
    {
        $analyses = $this->monthlyCount(AiAnalysis::query()->accessibleBy($user), $from, $to);
        $conversations = $this->monthlyCount(AiConversation::query()->accessibleBy($user), $from, $to);
        $plans = $this->monthlyCount(AiSessionPlan::query()->accessibleBy($user), $from, $to);

        return collect($this->months($from, $to))
            ->map(fn (string $month) => [
                'bucket' => $month,
                'analyses' => (int) ($analyses[$month] ?? 0),
                'conversations' => (int) ($conversations[$month] ?? 0),
                'plans' => (int) ($plans[$month] ?? 0),
            ])
            ->all();
    }

    private function monthlyCount($query, Carbon $from, Carbon $to): Collection
    {
        $bucket = $this->monthBucket('created_at');

        return $query
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("{$bucket} as bucket, count(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');
    }

    /**
     * Buckets mensuales YYYY-MM en el motor activo. MySQL usa DATE_FORMAT;
     * SQLite (tests/E2E) usa strftime con identica semantica.
     */
    private function monthBucket(string $column): string
    {
        return DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column})"
            : "DATE_FORMAT({$column}, '%Y-%m')";
    }

    private function topLocations(User $user): array
    {
        return Location::query()
            ->accessibleBy($user)
            ->withCount('sessions')
            ->orderByDesc('sessions_count')
            ->orderByDesc('rating')
            ->limit(6)
            ->get()
            ->map(fn (Location $location) => [
                'label' => $location->name,
                'total' => (int) $location->sessions_count,
                'meta' => $location->city,
            ])
            ->all();
    }

    private function groupCount($query, string $column): array
    {
        return $query
            ->select($column, DB::raw('count(*) as total'))
            ->whereNotNull($column)
            ->groupBy($column)
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['label' => (string) $row->{$column}, 'total' => (int) $row->total])
            ->all();
    }

    private function months(Carbon $from, Carbon $to): array
    {
        return collect(CarbonPeriod::create($from->copy()->startOfMonth(), '1 month', $to->copy()->endOfMonth()))
            ->map(fn (Carbon $date) => $date->format('Y-m'))
            ->all();
    }

    private function fillMonths(Carbon $from, Carbon $to, Collection $rows): array
    {
        return collect($this->months($from, $to))
            ->map(fn (string $month) => ['bucket' => $month, 'total' => (int) ($rows[$month] ?? 0)])
            ->all();
    }
}
