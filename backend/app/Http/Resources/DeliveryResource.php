<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'client' => new ClientResource($this->whenLoaded('client')),
            'session_id' => $this->session_id,
            'session' => new SessionResource($this->whenLoaded('session')),
            'title' => $this->title,
            'status' => $this->status,
            'budget' => $this->budget,
            'delivery_date' => $this->delivery_date?->toDateString(),
            'gallery_url' => $this->gallery_url,
            'private_notes' => $this->private_notes,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
