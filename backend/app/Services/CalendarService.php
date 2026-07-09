<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CalendarService
{
    public const SOURCES = ['session', 'delivery', 'task'];

    /**
     * Eventos normalizados del rango [from, to] para el calendario y la agenda.
     * Cada fuente se consulta una vez con eager loading para evitar N+1.
     */
    public function events(User $user, string $from, string $to, array $sources = []): array
    {
        $sources = array_values(array_intersect($sources ?: self::SOURCES, self::SOURCES));

        return collect($sources)
            ->flatMap(fn (string $source) => match ($source) {
                'session' => $this->sessions($user, $from, $to),
                'delivery' => $this->deliveries($user, $from, $to),
                'task' => $this->tasks($user, $from, $to),
            })
            ->sortBy([['date', 'asc'], ['time', 'asc']])
            ->values()
            ->all();
    }

    /**
     * Mueve un evento arrastrado en el calendario. Devuelve el modelo actualizado.
     */
    public function move(User $user, string $source, int $id, string $date, ?string $time = null): Model
    {
        abort_unless(in_array($source, self::SOURCES, true), 422);

        $model = $this->find($user, $source, $id);

        $model->update(match ($source) {
            'session' => array_filter(['date' => $date, 'time' => $time], fn ($value) => $value !== null),
            'delivery' => ['delivery_date' => $date],
            'task' => ['due_date' => $date, 'due_time' => $time],
        });

        return $model->refresh();
    }

    public function find(User $user, string $source, int $id): Model
    {
        $query = match ($source) {
            'session' => Session::query(),
            'delivery' => Delivery::query(),
            'task' => Task::query(),
        };

        return $query->ownedBy($user->id)->findOrFail($id);
    }

    private function sessions(User $user, string $from, string $to): array
    {
        return Session::query()
            ->ownedBy($user->id)
            ->with('location:id,name,city')
            ->whereBetween('date', [$from, $to])
            ->get()
            ->map(fn (Session $session) => $this->event(
                'session',
                $session->id,
                $session->name,
                $session->date?->toDateString(),
                $session->time,
                $session->status,
                [
                    'session_type' => $session->session_type,
                    'client_name' => $session->client_name,
                    'location' => $session->location?->name ?? $session->location_name,
                ],
                '/app/sessions',
            ))
            ->all();
    }

    private function deliveries(User $user, string $from, string $to): array
    {
        return Delivery::query()
            ->ownedBy($user->id)
            ->with('client:id,name')
            ->whereNotNull('delivery_date')
            ->whereBetween('delivery_date', [$from, $to])
            ->get()
            ->map(fn (Delivery $delivery) => $this->event(
                'delivery',
                $delivery->id,
                $delivery->title,
                $delivery->delivery_date?->toDateString(),
                null,
                $delivery->status,
                ['client' => $delivery->client?->name, 'budget' => $delivery->budget],
                "/app/deliveries/{$delivery->id}",
            ))
            ->all();
    }

    private function tasks(User $user, string $from, string $to): array
    {
        return Task::query()
            ->ownedBy($user->id)
            ->with(['session:id,name', 'client:id,name'])
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$from, $to])
            ->get()
            ->map(fn (Task $task) => $this->event(
                'task',
                $task->id,
                $task->title,
                $task->due_date?->toDateString(),
                $task->due_time,
                $task->status,
                [
                    'priority' => $task->priority,
                    'session' => $task->session?->name,
                    'client' => $task->client?->name,
                ],
                '/app/tasks',
            ))
            ->all();
    }

    private function event(string $source, int $id, string $title, ?string $date, ?string $time, ?string $status, array $meta, string $url): array
    {
        return [
            'id' => "{$source}-{$id}",
            'source' => $source,
            'source_id' => $id,
            'title' => $title,
            'date' => $date,
            'time' => $time ? substr($time, 0, 5) : null,
            'status' => $status,
            'meta' => array_filter($meta, fn ($value) => $value !== null && $value !== ''),
            'url' => $url,
            'draggable' => true,
        ];
    }
}
