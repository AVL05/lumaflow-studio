<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiSessionPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'session' => new SessionResource($this->whenLoaded('session')),
            'title' => $this->title,
            'plan' => $this->plan,
            'summary' => $this->summary,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
