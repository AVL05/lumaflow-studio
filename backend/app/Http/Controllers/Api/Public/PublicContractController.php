<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicContractResource;
use App\Models\Contract;
use App\Services\ContractPortalService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class PublicContractController extends Controller
{
    public function __construct(
        private readonly ContractPortalService $portal,
        private readonly NotificationService $notifications,
    ) {}

    public function show(string $token): PublicContractResource
    {
        return new PublicContractResource($this->portal->resolveUsable($token));
    }

    public function accept(string $token): PublicContractResource
    {
        $link = $this->portal->resolveUsable($token);
        $already = $link->contract->getAttribute('status') === Contract::STATUS_ACCEPTED;

        $contract = $this->portal->accept($link);

        if (! $already) {
            $this->notifications->success(
                $contract->user,
                'Contrato aceptado por el cliente',
                $contract->title,
                "/app/contracts/{$contract->getKey()}",
            );
        }

        return (new PublicContractResource($link->refresh()))->additional([
            'meta' => ['already_processed' => $already],
        ]);
    }

    public function reject(Request $request, string $token): PublicContractResource
    {
        $data = $request->validate(['message' => ['nullable', 'string', 'max:2000']]);

        $link = $this->portal->resolveUsable($token);
        $already = $link->contract->getAttribute('status') === Contract::STATUS_REJECTED;

        $contract = $this->portal->reject($link, $data['message'] ?? null);

        if (! $already) {
            $this->notifications->warning(
                $contract->user,
                'El cliente ha rechazado el contrato',
                $contract->title,
                "/app/contracts/{$contract->getKey()}",
            );
        }

        return (new PublicContractResource($link->refresh()))->additional([
            'meta' => ['already_processed' => $already],
        ]);
    }
}
