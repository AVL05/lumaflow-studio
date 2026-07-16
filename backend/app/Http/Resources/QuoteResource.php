<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'client' => new ClientResource($this->whenLoaded('client')),
            'session_id' => $this->session_id,
            'session' => new SessionResource($this->whenLoaded('session')),
            'quote_number' => $this->quote_number,
            'status' => $this->status,
            'issue_date' => $this->issue_date?->toDateString(),
            'valid_until' => $this->valid_until?->toDateString(),
            'subtotal' => $this->subtotal,
            'tax_rate' => $this->tax_rate,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'notes' => $this->notes,
            'items' => QuoteItemResource::collection($this->whenLoaded('items')),
            'invoice_id' => $this->whenLoaded('invoice', fn () => $this->invoice?->id),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
