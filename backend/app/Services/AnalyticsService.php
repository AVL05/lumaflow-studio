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

        return [
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'kpis' => $this->kpis($user, $from, $to),
            'sessionsByMonth' => $this->sessionsByMonth($user, $from, $to),
            'sessionTypes' => $this->groupCount(Session::query()->ownedBy($user->id)->whereBetween('date', [$from, $to]), 'session_type'),
            'projectStatus' => $this->groupCount(Delivery::query()->ownedBy($user->id), 'status'),
            'presetUsage' => $this->presetUsage($user),
            'aiUsage' => $this->aiUsage($user, $from, $to),
            'photosByCategory' => $this->groupCount(Photo::query()->ownedBy($user->id)->whereBetween('created_at', [$from, $to]), 'category'),
            'gearUsage' => $this->gearUsage($user),
            'clientsByStatus' => $this->groupCount(Client::query()->ownedBy($user->id), 'status'),
            'tasksByStatus' => $this->groupCount(Task::query()->ownedBy($user->id), 'status'),
            'topLocations' => $this->topLocations($user),
        ];
    }

    private function kpis(User $user, Carbon $from, Carbon $to): array
    {
        $sessions = Session::query()->ownedBy($user->id)->whereBetween('date', [$from, $to]);
        $previousFrom = $from->copy()->subDays($from->diffInDays($to) + 1);
        $previousSessions = Session::query()->ownedBy($user->id)->whereBetween('date', [$previousFrom, $from])->count();
        $currentSessions = (clone $sessions)->count();

        return [
            'sessions' => $currentSessions,
            'sessionsTrend' => $this->trend($currentSessions, $previousSessions),
            'completedSessions' => (clone $sessions)->whereIn('status', ['completed', 'delivered'])->count(),
            'photos' => Photo::query()->ownedBy($user->id)->whereBetween('created_at', [$from, $to])->count(),
            'revenue' => (float) Delivery::query()
                ->ownedBy($user->id)
                ->whereIn('status', ['delivered', 'approved'])
                ->whereBetween('delivery_date', [$from, $to])
                ->sum('budget'),
            'pipeline' => (float) Delivery::query()
                ->ownedBy($user->id)
                ->whereIn('status', ['draft', 'pending'])
                ->sum('budget'),
            'activeClients' => Client::query()->ownedBy($user->id)->where('status', 'active')->count(),
            'openTasks' => Task::query()->ownedBy($user->id)->open()->count(),
            'overdueTasks' => Task::query()->ownedBy($user->id)->open()->whereDate('due_date', '<', now()->toDateString())->count(),
            'aiInteractions' => AiAnalysis::query()->where('user_id', $user->id)->whereBetween('created_at', [$from, $to])->count()
                + AiConversation::query()->ownedBy($user->id)->whereBetween('created_at', [$from, $to])->count(),
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
        $rows = Session::query()
            ->ownedBy($user->id)
            ->whereBetween('date', [$from, $to])
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as bucket, count(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return $this->fillMonths($from, $to, $rows);
    }

    private function aiUsage(User $user, Carbon $from, Carbon $to): array
    {
        $analyses = $this->monthlyCount(AiAnalysis::query()->where('user_id', $user->id), $from, $to);
        $conversations = $this->monthlyCount(AiConversation::query()->ownedBy($user->id), $from, $to);
        $plans = $this->monthlyCount(AiSessionPlan::query()->ownedBy($user->id), $from, $to);

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
        return $query
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as bucket, count(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');
    }

    private function presetUsage(User $user): array
    {
        return Preset::query()
            ->ownedBy($user->id)
            ->select('name', 'usage_count', 'style')
            ->orderByDesc('usage_count')
            ->limit(8)
            ->get()
            ->map(fn (Preset $preset) => [
                'label' => $preset->name,
                'total' => (int) $preset->usage_count,
                'meta' => $preset->style,
            ])
            ->all();
    }

    /**
     * "Equipo mas utilizado" se deriva del EXIF real de las fotos y se cruza con
     * el inventario del usuario, en lugar de un contador sintetico.
     */
    private function gearUsage(User $user): array
    {
        $exif = Photo::query()
            ->ownedBy($user->id)
            ->selectRaw("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(exif, '$.camera_model')), JSON_UNQUOTE(JSON_EXTRACT(exif, '$.lens'))) as label, count(*) as total")
            ->whereNotNull('exif')
            ->groupBy('label')
            ->havingRaw('label is not null')
            ->orderByDesc('total')
            ->limit(8)
            ->get();

        $inventory = GearItem::query()
            ->ownedBy($user->id)
            ->get(['name', 'model', 'brand'])
            ->map(fn (GearItem $item) => mb_strtolower(trim($item->model ?: $item->name)));

        return $exif
            ->map(fn ($row) => [
                'label' => (string) $row->label,
                'total' => (int) $row->total,
                'owned' => $inventory->contains(fn (string $gear) => $gear !== '' && str_contains(mb_strtolower((string) $row->label), $gear)),
            ])
            ->all();
    }

    private function topLocations(User $user): array
    {
        return Location::query()
            ->ownedBy($user->id)
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
