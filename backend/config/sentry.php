<?php

use App\Support\SentryScrubber;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

return [
    /*
    |--------------------------------------------------------------------------
    | Sentry error tracking (opcional)
    |--------------------------------------------------------------------------
    |
    | Sin DSN el SDK no envia nada y la app funciona con normalidad.
    | Release: SENTRY_RELEASE, o el commit del proveedor cuando existe,
    | o 'unknown' como fallback honesto. Trazas desactivadas por defecto:
    | el objetivo es error tracking, no APM.
    |
    */
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    'environment' => env('SENTRY_ENVIRONMENT', env('APP_ENV', 'production')),
    'release' => env('SENTRY_RELEASE', env('RENDER_GIT_COMMIT', env('GITHUB_SHA', 'unknown'))),
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.0),
    'profiles_sample_rate' => (float) env('SENTRY_PROFILES_SAMPLE_RATE', 0.0),
    'send_default_pii' => false,

    // Ruido funcional esperado: nunca es incidente. Los HttpException 500
    // genericos (p. ej. abort(500)) si se reportan.
    'ignore_exceptions' => [
        AuthenticationException::class,
        AuthorizationException::class,
        ModelNotFoundException::class,
        ValidationException::class,
        AccessDeniedHttpException::class,
        BadRequestHttpException::class,
        MethodNotAllowedHttpException::class,
        NotFoundHttpException::class,
        TooManyRequestsHttpException::class,
        UnauthorizedHttpException::class,
    ],

    'before_send' => fn (array $event): array => SentryScrubber::scrub($event),
];
