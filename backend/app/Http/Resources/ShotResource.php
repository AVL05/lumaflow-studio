<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return array_merge($this->resource->only(['id', 'job_id', 'session_id', 'location_id', 'scene', 'description', 'shot_type', 'camera_movement', 'focal_length', 'estimated_seconds', 'scheduled_time', 'notes', 'status', 'position', 'revision']), [
            'location' => new LocationResource($this->whenLoaded('location')),
            'gear_items' => $this->whenLoaded('gearItems', fn () => $this->gearItems->map->only(['id', 'name'])->values()),
        ]);
    }
}
