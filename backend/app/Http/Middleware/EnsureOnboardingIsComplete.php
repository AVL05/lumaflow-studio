<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingIsComplete
{
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        if (! $request->user()?->onboarding_completed_at) {
            return response()->json([
                'message' => 'Completa la configuracion inicial para continuar.',
                'code' => 'onboarding_required',
            ], 409);
        }

        return $next($request);
    }
}
