<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'job_id' => $this->job_id,
            'location_id' => $this->location_id,
            'location' => new LocationResource($this->whenLoaded('location')),
            'name' => $this->name,
            'date' => $this->date?->toDateString(),
            'time' => $this->time,
            'location_name' => $this->location_name,
            'session_type' => $this->session_type,
            'status' => $this->status,
            'description' => $this->description,
            'notes' => $this->notes,
            'client_name' => $this->client_name,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
