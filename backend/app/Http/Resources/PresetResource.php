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
            'gear_item_id' => $this->gear_item_id,
            'gear_item' => $this->whenLoaded('gearItem', fn () => [
                'id' => $this->gearItem->id,
                'name' => $this->gearItem->name,
                'brand' => $this->gearItem->brand,
                'model' => $this->gearItem->model,
            ]),
            'name' => $this->name,
            'category' => $this->category,
            'iso' => $this->iso,
            'aperture' => $this->aperture,
            'shutter_speed' => $this->shutter_speed,
            'white_balance' => $this->white_balance,
            'exposure_compensation' => $this->exposure_compensation,
            'notes' => $this->notes,
        ];
    }
}
