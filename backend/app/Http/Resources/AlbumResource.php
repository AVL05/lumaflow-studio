<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlbumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'color' => $this->color,
            'cover_photo_id' => $this->cover_photo_id,
            'cover_photo' => new PhotoResource($this->whenLoaded('coverPhoto')),
            'date' => $this->date?->toDateString(),
            'photos_count' => $this->whenCounted('photos'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
