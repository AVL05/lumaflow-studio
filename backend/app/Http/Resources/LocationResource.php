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
            'notes' => $this->notes,
            'tags' => $this->tags ?? [],
            'recommended_gear' => $this->recommended_gear ?? [],
            'cover_photo_id' => $this->cover_photo_id,
            'cover_photo' => new PhotoResource($this->whenLoaded('coverPhoto')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
