<?php

namespace App\Http\Resources;

use App\Models\ContractPortalLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Vista publica del contrato: solo lo estrictamente necesario para revisar
 * y responder. Nunca identificadores internos, memberships ni notas privadas.
 */
class PublicContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var ContractPortalLink $link */
        $link = $this->resource;
        $contract = $link->contract;

        return [
            'contract_number' => $contract->contract_number,
            'title' => $contract->title,
            // Exclusivamente el snapshot congelado al enviar, nunca el borrador vivo.
            'content' => $contract->content_snapshot,
            'status' => $contract->status,
            'version' => $contract->version,
            'studio_name' => $contract->user?->studio_name ?? $contract->user?->name,
            'client_name' => $contract->client?->name,
            'service' => $contract->job?->title,
            'event_date' => $contract->job?->event_date?->toDateString(),
            'sent_at' => $contract->sent_at?->toISOString(),
            'expires_at' => $link->expires_at?->toISOString(),
            'decided_at' => $contract->accepted_at?->toISOString() ?? $contract->rejected_at?->toISOString(),
        ];
    }
}
