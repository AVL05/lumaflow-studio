<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class AiContextService
{
    public function forUser(User $user, array $focus = [], ?int $workspaceId = null): array
    {
        $workspaceId ??= (int) $user->current_workspace_id;
        $context = [
            'user' => Arr::only($user->toArray(), ['name']),
            'sessions' => $this->sessions($user, $workspaceId),
            'gear' => $this->gear($user, $workspaceId),
            'locations' => $this->locations($user, $workspaceId),
            'clients' => $this->clients($user, $workspaceId),
            'deliveries' => $this->deliveries($user, $workspaceId),
            'focus' => $this->sanitize($focus),
        ];

        return $this->limit($context);
    }

    private function sessions(User $user, int $workspaceId): array
    {
        return $user->sessions()
            ->accessibleBy($user)->where('workspace_id', $workspaceId)
            ->with('location:id,name,city,country,type,best_time,rating,is_favorite')
            ->select('id', 'location_id', 'name', 'date', 'time', 'session_type', 'status', 'location_name', 'client_name')
            ->latest('date')
            ->limit(10)
            ->get()
            ->toArray();
    }

    private function gear(User $user, int $workspaceId): array
    {
        return $user->gearItems()
            ->accessibleBy($user)->where('workspace_id', $workspaceId)
            ->select('name', 'category', 'brand', 'model', 'condition', 'is_favorite')
            ->orderByDesc('is_favorite')
            ->limit(20)
            ->get()
            ->toArray();
    }

    private function locations(User $user, int $workspaceId): array
    {
        return $user->locations()
            ->accessibleBy($user)->where('workspace_id', $workspaceId)
            ->select('id', 'name', 'city', 'country', 'latitude', 'longitude', 'type', 'best_time', 'access_difficulty', 'rating', 'is_favorite', 'access_mode', 'recommended_weather', 'recommended_seasons', 'tags', 'recommended_gear')
            ->orderByDesc('is_favorite')
            ->latest()
            ->limit(16)
            ->get()
            ->toArray();
    }

    private function clients(User $user, int $workspaceId): array
    {
        return $user->clients()
            ->accessibleBy($user)->where('workspace_id', $workspaceId)
            ->select('id', 'name', 'company', 'status', 'notes')
            ->latest()
            ->limit(12)
            ->get()
            ->toArray();
    }

    private function deliveries(User $user, int $workspaceId): array
    {
        return $user->deliveries()
            ->accessibleBy($user)->where('workspace_id', $workspaceId)
            ->with(['client:id,name', 'session:id,name'])
            ->select('id', 'client_id', 'session_id', 'title', 'status', 'budget', 'delivery_date')
            ->latest()
            ->limit(12)
            ->get()
            ->toArray();
    }

    private function limit(array $context): array
    {
        $max = max(4000, (int) config('ollama.max_context'));
        $json = json_encode($context, JSON_UNESCAPED_UNICODE);

        if (strlen($json) <= $max) {
            return $context;
        }

        foreach (['gear', 'sessions', 'locations'] as $key) {
            $context[$key] = Collection::make($context[$key])->take(8)->values()->all();
            if (strlen(json_encode($context, JSON_UNESCAPED_UNICODE)) <= $max) {
                break;
            }
        }

        return $context;
    }

    private function sanitize(array $data): array
    {
        return collect($data)
            ->map(fn ($value) => is_string($value) ? trim(strip_tags($value)) : $value)
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->all();
    }
}
