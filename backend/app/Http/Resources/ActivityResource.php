<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'description' => $this->description,
            'properties' => $this->properties,
            'subject_type' => class_basename($this->subject_type),
            'subject_id' => $this->subject_id,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
