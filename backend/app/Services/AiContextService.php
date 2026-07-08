<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class AiContextService
{
    public function forUser(User $user, array $focus = []): array
    {
        $context = [
            'user' => Arr::only($user->toArray(), ['name']),
            'sessions' => $this->sessions($user),
            'gear' => $this->gear($user),
            'presets' => $this->presets($user),
            'photos' => $this->photos($user),
            'albums' => $this->albums($user),
            'locations' => $this->locations($user),
            'clients' => $this->clients($user),
            'deliveries' => $this->deliveries($user),
            'tags' => $this->tags($user),
            'focus' => $this->sanitize($focus),
        ];

        return $this->limit($context);
    }

    private function sessions(User $user): array
    {
        return $user->sessions()
            ->with('location:id,name,city,country,type,best_time,rating,is_favorite')
            ->select('id', 'location_id', 'name', 'date', 'time', 'session_type', 'status', 'location_name', 'client_name')
            ->latest('date')
            ->limit(10)
            ->get()
            ->toArray();
    }

    private function gear(User $user): array
    {
        return $user->gearItems()
            ->select('name', 'category', 'brand', 'model', 'condition', 'is_favorite')
            ->orderByDesc('is_favorite')
            ->limit(20)
            ->get()
            ->toArray();
    }

    private function presets(User $user): array
    {
        return $user->presets()
            ->select('name', 'category', 'style', 'contrast', 'shadows', 'highlights', 'temperature', 'saturation', 'clarity', 'grain', 'recommended_use', 'is_favorite', 'usage_count')
            ->orderByDesc('usage_count')
            ->limit(16)
            ->get()
            ->toArray();
    }

    private function photos(User $user): array
    {
        return $user->photos()
            ->with(['session:id,name', 'albums:id,name', 'tags:id,name'])
            ->select('id', 'session_id', 'title', 'description', 'category', 'is_favorite', 'exif', 'taken_at')
            ->latest()
            ->limit(18)
            ->get()
            ->toArray();
    }

    private function albums(User $user): array
    {
        return $user->albums()
            ->select('id', 'name', 'description', 'date')
            ->withCount('photos')
            ->latest()
            ->limit(10)
            ->get()
            ->toArray();
    }

    private function locations(User $user): array
    {
        return $user->locations()
            ->select('id', 'name', 'city', 'country', 'latitude', 'longitude', 'type', 'best_time', 'access_difficulty', 'rating', 'is_favorite', 'access_mode', 'recommended_weather', 'recommended_seasons', 'tags', 'recommended_gear')
            ->orderByDesc('is_favorite')
            ->latest()
            ->limit(16)
            ->get()
            ->toArray();
    }

    private function clients(User $user): array
    {
        return $user->clients()
            ->select('id', 'name', 'company', 'status', 'notes')
            ->latest()
            ->limit(12)
            ->get()
            ->toArray();
    }

    private function deliveries(User $user): array
    {
        return $user->deliveries()
            ->with(['client:id,name', 'session:id,name'])
            ->select('id', 'client_id', 'session_id', 'title', 'status', 'budget', 'delivery_date')
            ->latest()
            ->limit(12)
            ->get()
            ->toArray();
    }

    private function tags(User $user): array
    {
        return $user->tags()
            ->select('id', 'name')
            ->withCount('photos')
            ->orderByDesc('photos_count')
            ->limit(30)
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

        foreach (['photos', 'gear', 'presets', 'sessions', 'locations', 'tags'] as $key) {
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
