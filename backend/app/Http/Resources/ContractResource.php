<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_number' => $this->contract_number,
            'title' => $this->title,
            'content' => $this->content,
            'content_snapshot' => $this->content_snapshot,
            'status' => $this->status,
            'version' => $this->version,
            'job_id' => $this->job_id,
            'client_id' => $this->client_id,
            'quote_id' => $this->quote_id,
            'client' => new ClientResource($this->whenLoaded('client')),
            'job' => $this->whenLoaded('job', fn () => [
                'id' => $this->job->id,
                'title' => $this->job->title,
                'status' => $this->job->status,
                'event_date' => $this->job->event_date?->toDateString(),
            ]),
            'quote' => $this->whenLoaded('quote', fn () => [
                'id' => $this->quote->id,
                'quote_number' => $this->quote->quote_number,
                'total' => $this->quote->total,
            ]),
            'expires_at' => $this->expires_at?->toDateString(),
            'client_message' => $this->client_message,
            'client_responded_at' => $this->client_responded_at?->toISOString(),
            'sent_at' => $this->sent_at?->toISOString(),
            'accepted_at' => $this->accepted_at?->toISOString(),
            'rejected_at' => $this->rejected_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
