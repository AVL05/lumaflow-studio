<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'session' => new SessionResource($this->whenLoaded('session')),
            'client_id' => $this->client_id,
            'client' => new ClientResource($this->whenLoaded('client')),
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'status' => $this->status,
            'due_date' => $this->due_date?->toDateString(),
            'due_time' => $this->due_time ? substr($this->due_time, 0, 5) : null,
            'is_overdue' => $this->due_date !== null
                && ! in_array($this->status, ['completed', 'cancelled'], true)
                && $this->due_date->isBefore(now()->startOfDay()),
            'completed_at' => $this->completed_at?->toISOString(),
            'position' => $this->position,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
