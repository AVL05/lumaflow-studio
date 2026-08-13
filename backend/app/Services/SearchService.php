<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Job;
use App\Models\Location;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;

class SearchService
{
    public const GROUPS = [
        'jobs', 'sessions', 'clients', 'gear', 'locations', 'tasks', 'deliveries',
    ];

    private const LABELS = [
        'jobs' => 'Trabajos',
        'sessions' => 'Sesiones',
        'clients' => 'Clientes',
        'gear' => 'Equipo',
        'locations' => 'Localizaciones',
        'tasks' => 'Tareas',
        'deliveries' => 'Entregas',
    ];

    /**
     * Busqueda unificada e incremental. Cada grupo se limita para mantener
     * la respuesta ligera en el atajo Ctrl+K.
     */
    public function search(User $user, string $term, array $groups = [], int $perGroup = 5): array
    {
        $term = trim($term);

        if ($term === '') {
            return ['term' => '', 'total' => 0, 'groups' => []];
        }

        $groups = array_values(array_intersect($groups ?: self::GROUPS, self::GROUPS));
        $results = [];
        $total = 0;

        foreach ($groups as $group) {
            $items = $this->resolve($group, $user, $term, $perGroup);

            if ($items === []) {
                continue;
            }

            $total += count($items);
            $results[] = [
                'group' => $group,
                'label' => self::LABELS[$group],
                'items' => $items,
            ];
        }

        return ['term' => $term, 'total' => $total, 'groups' => $results];
    }

    private function resolve(string $group, User $user, string $term, int $limit): array
    {
        return match ($group) {
            'jobs' => Job::query()->ownedBy($user->id)->search($term)->limit($limit)->get()
                ->map(fn (Job $item) => $this->item('jobs', $item->id, $item->title, $item->event_date?->toDateString(), "/app/jobs/{$item->id}", $item->status))->all(),

            'sessions' => Session::query()->ownedBy($user->id)->search($term)->limit($limit)->get()
                ->map(fn (Session $item) => $this->item('sessions', $item->id, $item->name, $item->client_name ?? $item->location_name, '/app/sessions', $item->status))->all(),

            'clients' => Client::query()->ownedBy($user->id)->search($term)->limit($limit)->get()
                ->map(fn (Client $item) => $this->item('clients', $item->id, $item->name, $item->company ?? $item->email, "/app/clients/{$item->id}", $item->status))->all(),

            'gear' => GearItem::query()->ownedBy($user->id)->search($term)->limit($limit)->get()
                ->map(fn (GearItem $item) => $this->item('gear', $item->id, $item->name, trim(($item->brand ?? '').' '.($item->model ?? '')), '/app/gear', $item->category))->all(),

            'locations' => Location::query()->ownedBy($user->id)->search($term)->limit($limit)->get()
                ->map(fn (Location $item) => $this->item('locations', $item->id, $item->name, trim(($item->city ?? '').' '.($item->country ?? '')), "/app/locations/{$item->id}", $item->type))->all(),

            'tasks' => Task::query()->ownedBy($user->id)->search($term)->limit($limit)->get()
                ->map(fn (Task $item) => $this->item('tasks', $item->id, $item->title, $item->due_date?->toDateString(), '/app/tasks', $item->status))->all(),

            'deliveries' => Delivery::query()->ownedBy($user->id)->search($term)->limit($limit)->get()
                ->map(fn (Delivery $item) => $this->item('deliveries', $item->id, $item->title, $item->delivery_date?->toDateString(), "/app/deliveries/{$item->id}", $item->status))->all(),
        };
    }

    private function item(string $group, int $id, ?string $title, ?string $subtitle, string $url, ?string $meta): array
    {
        return [
            'group' => $group,
            'id' => $id,
            'title' => $title ?: 'Sin titulo',
            'subtitle' => $subtitle ?: null,
            'url' => $url,
            'meta' => $meta,
        ];
    }
}
