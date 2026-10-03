<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Resumen agregado de tareas. Lo consumen el dashboard y la pagina de tareas,
 * que antes obtenia estos totales cargando el dashboard entero.
 */
class TaskSummaryService
{
    public function forUser(User $user): array
    {
        $totals = Task::query()
            ->accessibleBy($user)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $today = now()->toDateString();

        return [
            'byStatus' => collect(Task::STATUSES)
                ->map(fn (string $status) => ['status' => $status, 'total' => (int) ($totals[$status] ?? 0)])
                ->values()
                ->all(),
            'open' => Task::query()->accessibleBy($user)->open()->count(),
            'overdue' => Task::query()->accessibleBy($user)->open()->whereDate('due_date', '<', $today)->count(),
            'dueToday' => Task::query()->accessibleBy($user)->open()->whereDate('due_date', $today)->count(),
        ];
    }
}
