<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DeliveryImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'filename' => $this->filename,
            'url' => Storage::disk('public')->url($this->path),
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'position' => $this->position,
            'client_favorite' => $this->client_favorite,
        ];
    }
}
