<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'client_id' => $this->client_id, 'location_id' => $this->location_id,
            'title' => $this->title, 'specialty' => $this->specialty, 'workflow_key' => $this->workflow_key,
            'status' => $this->status, 'event_date' => $this->event_date?->toDateString(), 'description' => $this->description,
            'budget' => $this->budget, 'deposit_amount' => $this->deposit_amount,
            'contract_status' => $this->contract_status, 'contract_url' => $this->contract_url,
            'contract_signed_at' => $this->contract_signed_at?->toISOString(),
            'client' => new ClientResource($this->whenLoaded('client')),
            'location' => $this->whenLoaded('location'), 'gear_items' => $this->whenLoaded('gearItems'),
            'sessions' => SessionResource::collection($this->whenLoaded('sessions')),
            'quotes' => QuoteResource::collection($this->whenLoaded('quotes')),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
            'deliveries' => DeliveryResource::collection($this->whenLoaded('deliveries')),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'counts' => $this->when(isset($this->tasks_count), fn () => ['tasks' => $this->tasks_count, 'open_tasks' => $this->open_tasks_count, 'sessions' => $this->sessions_count, 'deliveries' => $this->deliveries_count]),
            'created_at' => $this->created_at?->toISOString(), 'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
