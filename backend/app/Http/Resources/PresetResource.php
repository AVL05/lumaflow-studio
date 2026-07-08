<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PresetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category,
            'style' => $this->style,
            'contrast' => $this->contrast,
            'shadows' => $this->shadows,
            'highlights' => $this->highlights,
            'whites' => $this->whites,
            'blacks' => $this->blacks,
            'texture' => $this->texture,
            'intensity' => $this->intensity,
            'saturation' => $this->saturation,
            'vibrance' => $this->vibrance,
            'temperature' => $this->temperature,
            'tint' => $this->tint,
            'sharpness' => $this->sharpness,
            'noise_reduction' => $this->noise_reduction,
            'grain' => $this->grain,
            'clarity' => $this->clarity,
            'vignette' => $this->vignette,
            'recommended_use' => $this->recommended_use,
            'is_favorite' => $this->is_favorite,
            'color' => $this->color,
            'version' => $this->version,
            'usage_count' => $this->usage_count,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
