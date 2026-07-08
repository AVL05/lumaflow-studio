<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'session' => new SessionResource($this->whenLoaded('session')),
            'title' => $this->title,
            'description' => $this->description,
            'file_path' => $this->file_path,
            'url' => Storage::disk('public')->url($this->file_path),
            'thumbnail_path' => $this->thumbnail_path,
            'file_name' => $this->file_name,
            'file_size' => $this->file_size,
            'mime_type' => $this->mime_type,
            'taken_at' => $this->taken_at?->toDateString(),
            'category' => $this->category,
            'is_favorite' => $this->is_favorite,
            'albums' => AlbumResource::collection($this->whenLoaded('albums')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'exif' => $this->exif,
            'exif_summary' => [
                'iso' => $this->exif['iso'] ?? null,
                'aperture' => $this->exif['aperture'] ?? null,
                'lens' => $this->exif['lens'] ?? null,
                'camera_model' => $this->exif['camera_model'] ?? null,
            ],
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
