<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GearItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'brand' => $this->brand,
            'model' => $this->model,
            'weight_grams' => $this->weight_grams,
            'condition' => $this->condition,
            'purchase_date' => $this->purchase_date?->toDateString(),
            'purchase_price' => $this->purchase_price,
            'notes' => $this->notes,
            'is_favorite' => $this->is_favorite,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
