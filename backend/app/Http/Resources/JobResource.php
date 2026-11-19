<?php

namespace App\Http\Resources;

use App\Services\JobWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $details = $request->route('job') !== null || ! $request->isMethod('get');

        return [
            'id' => $this->id, 'client_id' => $this->client_id, 'location_id' => $this->location_id,
            'title' => $this->title, 'specialty' => $this->specialty, 'workflow_key' => $this->workflow_key,
            'project_type' => $this->project_type ?? 'photography',
            'production_phase' => JobWorkflowService::phaseFor($this->status),
            'participants' => $this->when($details, fn () => $this->participants ?? []), 'external_links' => $this->when($details, fn () => $this->external_links ?? []),
            'start_date' => $this->start_date?->toDateString(), 'end_date' => $this->end_date?->toDateString(), 'delivery_due_date' => $this->delivery_due_date?->toDateString(),
            'locations' => $this->whenLoaded('locations'),
            'briefing' => $this->when($request->route('job') !== null, fn () => (object) ($this->briefing ?? [])),
            'briefing_revision' => $this->when($request->route('job') !== null, fn () => $this->briefing_revision ?? 0),
            'status' => $this->status, 'event_date' => $this->event_date?->toDateString(), 'description' => $this->description,
            'is_demo' => (bool) $this->is_demo,
            'budget' => $this->budget, 'deposit_amount' => $this->deposit_amount,
            'contract_status' => $this->contract_status, 'contract_url' => $this->contract_url,
            'contract_signed_at' => $this->contract_signed_at?->toISOString(),
            'client' => new ClientResource($this->whenLoaded('client')),
            'location' => $this->whenLoaded('location'), 'gear_items' => $this->whenLoaded('gearItems'),
            'sessions' => SessionResource::collection($this->whenLoaded('sessions')),
            'quotes' => QuoteResource::collection($this->whenLoaded('quotes')),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'contracts' => ContractResource::collection($this->whenLoaded('contracts')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
            'deliveries' => DeliveryResource::collection($this->whenLoaded('deliveries')),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'counts' => $this->when(isset($this->tasks_count), fn () => ['tasks' => $this->tasks_count, 'open_tasks' => $this->open_tasks_count, 'sessions' => $this->sessions_count, 'deliveries' => $this->deliveries_count]),
            'created_at' => $this->created_at?->toISOString(), 'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
