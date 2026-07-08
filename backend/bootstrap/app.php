<?php

use App\Support\AuditLog;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Solo se registran los fallos inesperados: 4xx esperados y errores de
        // validacion son ruido, no incidentes.
        $exceptions->report(function (Throwable $exception): bool {
            if ($exception instanceof ValidationException || $exception instanceof AuthenticationException) {
                return false;
            }

            if ($exception instanceof HttpExceptionInterface && $exception->getStatusCode() < 500) {
                return false;
            }

            $request = request();

            if ($request->is('api/*')) {
                AuditLog::apiException($exception, $request->method(), $request->path(), $request->user()?->id);
            }

            return true;
        });
    })->create();
