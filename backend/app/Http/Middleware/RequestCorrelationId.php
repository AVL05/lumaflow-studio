<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Sentry\Laravel\Facade;
use Sentry\State\Scope;
use Symfony\Component\HttpFoundation\Response;

/**
 * ID de correlacion por request (Issue #11).
 *
 * Acepta `X-Request-ID` del cliente solo con formato seguro (UUID o
 * alfanumerico limitado); si falta o es invalido, genera uno. Se devuelve
 * en la respuesta, se anade al contexto de logs y al scope de Sentry
 * cuando el proveedor esta configurado. Fail-safe: nunca tumba requests.
 */
class RequestCorrelationId
{
    public const HEADER = 'X-Request-ID';

    public const MAX_LENGTH = 100;

    public static function resolve(?string $incoming): string
    {
        $candidate = trim((string) $incoming);

        if ($candidate !== '' && strlen($candidate) <= self::MAX_LENGTH
            && preg_match('/\A[a-zA-Z0-9][a-zA-Z0-9\-_:.]*\z/', $candidate)) {
            return $candidate;
        }

        return (string) Str::uuid();
    }

    public function handle(Request $request, Closure $next): Response
    {
        $requestId = self::resolve($request->header(self::HEADER));
        $request->attributes->set('request_id', $requestId);

        Log::shareContext(['request_id' => $requestId]);

        if (config('sentry.dsn') && class_exists(Facade::class)) {
            \Sentry\configureScope(function (Scope $scope) use ($requestId): void {
                $scope->setTag('request_id', $requestId);
            });
        }

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set(self::HEADER, $requestId);

        return $response;
    }
}
