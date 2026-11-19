<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicContractResource;
use App\Services\ContractPortalService;
use Illuminate\Http\Request;

class PublicContractController extends Controller
{
    public function __construct(
        private readonly ContractPortalService $portal,
    ) {}

    public function show(string $token): PublicContractResource
    {
        return new PublicContractResource($this->portal->resolveUsable($token));
    }

    public function accept(string $token): PublicContractResource
    {
        $link = $this->portal->resolveUsable($token);
        $already = $this->portal->accept($link);

        return (new PublicContractResource($link->refresh()))->additional([
            'meta' => ['already_processed' => $already],
        ]);
    }

    public function reject(Request $request, string $token): PublicContractResource
    {
        $data = $request->validate(['message' => ['nullable', 'string', 'max:2000']]);

        $link = $this->portal->resolveUsable($token);
        $already = $this->portal->reject($link, $data['message'] ?? null);

        return (new PublicContractResource($link->refresh()))->additional([
            'meta' => ['already_processed' => $already],
        ]);
    }
}
