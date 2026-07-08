<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company' => $this->company,
            'instagram' => $this->instagram,
            'notes' => $this->notes,
            'status' => $this->status,
            'deliveries_count' => $this->whenCounted('deliveries'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
