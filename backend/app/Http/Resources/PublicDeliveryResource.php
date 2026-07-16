<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Vista publica de una entrega, accesible solo con el token secreto.
 * Expone lo minimo necesario para que el cliente revise y apruebe: nunca
 * notas privadas ni identificadores internos ajenos al propio recurso.
 */
class PublicDeliveryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'title' => $this->title,
            'status' => $this->status,
            'studio_name' => $this->user?->name,
            'client_name' => $this->client?->name,
            'session_name' => $this->session?->name,
            'delivery_date' => $this->delivery_date?->toDateString(),
            'gallery_url' => $this->gallery_url,
            'budget' => $this->budget,
            'payment_status' => $this->payment_status,
            'amount_paid' => $this->amount_paid,
            'client_message' => $this->client_message,
            'client_responded_at' => $this->client_responded_at?->toISOString(),
            'images' => DeliveryImageResource::collection($this->whenLoaded('images')),
        ];
    }
}
