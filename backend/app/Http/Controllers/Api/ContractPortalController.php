<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Services\ContractPortalService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ContractPortalController extends Controller
{
    public function __construct(private readonly ContractPortalService $portal) {}

    /** Estado del enlace para la UI interna (sin exponer el token). */
    public function show(Request $request, Contract $contract): JsonResponse
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404($request->user(), $contract);

        $link = $this->portal->activeLink($contract);

        return response()->json([
            'data' => $link ? [
                'active' => $link->isUsable(),
                'expires_at' => $link->expires_at?->toISOString(),
                'created_at' => $link->created_at?->toISOString(),
                'last_used_at' => $link->last_used_at?->toISOString(),
            ] : null,
        ]);
    }

    public function store(Request $request, Contract $contract): JsonResponse
    {
        $data = $request->validate(['expires_at' => ['nullable', 'date', 'after:today']]);

        ['link' => $link, 'token' => $token] = $this->portal->generate(
            $request->user(), $contract, $data['expires_at'] ?? null
        );

        return response()->json([
            'data' => [
                'active' => true,
                'expires_at' => $link->expires_at?->toISOString(),
            ],
            // El token plano solo se expone aqui para copiar el enlace.
            'meta' => ['token' => $token],
        ], 201);
    }

    public function regenerate(Request $request, Contract $contract): JsonResponse
    {
        $data = $request->validate(['expires_at' => ['nullable', 'date', 'after:today']]);

        ['link' => $link, 'token' => $token] = $this->portal->regenerate(
            $request->user(), $contract, $data['expires_at'] ?? null
        );

        return response()->json([
            'data' => [
                'active' => true,
                'expires_at' => $link->expires_at?->toISOString(),
            ],
            'meta' => ['token' => $token],
        ]);
    }

    public function destroy(Request $request, Contract $contract): Response
    {
        $this->portal->revoke($request->user(), $contract);

        return response()->noContent();
    }
}
