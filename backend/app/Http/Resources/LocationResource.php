<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'city' => $this->city,
            'country' => $this->country,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'type' => $this->type,
            'best_time' => $this->best_time,
            'access_difficulty' => $this->access_difficulty,
            'rating' => $this->rating,
            'is_favorite' => $this->is_favorite,
            'access_mode' => $this->access_mode,
            'permissions_required' => $this->permissions_required,
            'cost' => $this->cost,
            'google_maps_url' => $this->google_maps_url,
            'apple_maps_url' => $this->apple_maps_url,
            'openstreetmap_url' => $this->openstreetmap_url,
            'recommended_weather' => $this->recommended_weather,
            'recommended_seasons' => $this->recommended_seasons ?? [],
            'notes' => $this->notes,
            'tags' => $this->tags ?? [],
            'recommended_gear' => $this->recommended_gear ?? [],
            'sessions' => SessionResource::collection($this->whenLoaded('sessions')),
            'sessions_count' => $this->whenCounted('sessions'),
            'distance_km' => $this->when(isset($this->distance_km), fn () => round((float) $this->distance_km, 2)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
