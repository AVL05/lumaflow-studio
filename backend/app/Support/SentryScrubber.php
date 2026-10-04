<?php

namespace App\Support;

/**
 * Redaccion de eventos antes de enviarlos a observabilidad (Issue #11).
 *
 * Funcion pura para poder testearla sin SDK ni red. Nunca deben salir:
 * credenciales, tokens, datos personales, contenido contractual, notas
 * privadas, prompts/respuestas IA ni cuerpos de peticion completos.
 */
class SentryScrubber
{
    private const SENSITIVE_HEADERS = [
        'authorization',
        'cookie',
        'set-cookie',
        'x-xsrf-token',
        'x-csrf-token',
    ];

    private const SENSITIVE_BODY_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'api_key',
        'secret',
        'email',
        'phone',
        'prompt',
        'message',
        'content',
        'client_message',
        'notes',
    ];

    private const PUBLIC_TOKEN_PREFIXES = [
        '/public/contracts/',
        '/public/deliveries/',
        '/public/calendar/',
        '/public/studios/',
        '/api/public/contracts/',
        '/api/public/deliveries/',
        '/api/public/calendar/',
        '/api/public/studios/',
        '/deliver/',
        '/contract/',
    ];

    public static function scrub(array $event): array
    {
        if (isset($event['request']['headers']) && is_array($event['request']['headers'])) {
            foreach (self::SENSITIVE_HEADERS as $header) {
                unset($event['request']['headers'][$header]);
            }
        }

        if (isset($event['request']['url']) && is_string($event['request']['url'])) {
            $event['request']['url'] = self::scrubUrl($event['request']['url']);
        }

        // Sin cuerpos por defecto: solo metadata inocua sobrevive.
        unset($event['request']['data']);

        if (isset($event['breadcrumbs']['values']) && is_array($event['breadcrumbs']['values'])) {
            $event['breadcrumbs']['values'] = array_values(array_filter(
                array_map([self::class, 'scrubBreadcrumb'], $event['breadcrumbs']['values']),
                fn ($crumb) => $crumb !== null
            ));
        }

        if (isset($event['user']) && is_array($event['user'])) {
            $event['user'] = array_intersect_key($event['user'], ['id' => true]);
        }

        return $event;
    }

    public static function scrubBody(mixed $data): mixed
    {
        if (! is_array($data)) {
            return $data;
        }

        foreach ($data as $key => $value) {
            $name = strtolower((string) $key);

            if (in_array($name, self::SENSITIVE_BODY_KEYS, true)) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = self::scrubBody($value);
            }
        }

        return $data;
    }

    public static function scrubUrl(string $url): string
    {
        $path = (string) parse_url($url, PHP_URL_PATH);

        foreach (self::PUBLIC_TOKEN_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return str_replace($path, $prefix.'[REDACTED]', $url);
            }
        }

        return $url;
    }

    private static function scrubBreadcrumb(mixed $crumb): ?array
    {
        if (! is_array($crumb)) {
            return null;
        }

        $data = $crumb['data'] ?? null;

        if (is_array($data)) {
            if (isset($data['url']) && is_string($data['url'])) {
                $data['url'] = self::scrubUrl($data['url']);
            }

            foreach (['message', 'input', 'prompt', 'response', 'content'] as $field) {
                unset($data[$field]);
            }

            $crumb['data'] = $data;
        }

        if (isset($crumb['message']) && ! is_string($crumb['message'])) {
            unset($crumb['message']);
        }

        return $crumb;
    }
}
