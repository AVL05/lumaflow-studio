<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChecklistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'session' => new SessionResource($this->whenLoaded('session')),
            'name' => $this->name,
            'type' => $this->type,
            'position' => $this->position,
            'items' => ChecklistItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenCounted('items'),
            'completed_items_count' => $this->whenCounted('completedItems'),
            'progress' => $this->progress(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
