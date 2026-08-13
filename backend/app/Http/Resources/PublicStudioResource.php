<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicStudioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->studio_name ?? $this->name,
        ];
    }
}
