<?php

namespace App\Support;

use Sentry\Breadcrumb;
use Sentry\Event;
use Sentry\UserDataBag;

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
            foreach (array_keys($event['request']['headers']) as $header) {
                if (in_array(strtolower($header), self::SENSITIVE_HEADERS, true) || preg_match('/token|secret|api.key/i', $header)) {
                    unset($event['request']['headers'][$header]);
                }
            }
        }

        if (isset($event['request']['url']) && is_string($event['request']['url'])) {
            $event['request']['url'] = self::scrubUrl($event['request']['url']);
        }

        // Sin cuerpos por defecto: solo metadata inocua sobrevive.
        unset($event['request']['data'], $event['request']['query_string'], $event['request']['cookies'], $event['request']['env'], $event['extra']);
        if (isset($event['message'])) {
            $event['message'] = '[REDACTED]';
        }
        foreach ($event['exception']['values'] ?? [] as $index => $exception) {
            $event['exception']['values'][$index]['value'] = '[REDACTED]';
            foreach ($exception['stacktrace']['frames'] ?? [] as $frame => $value) {
                unset($event['exception']['values'][$index]['stacktrace']['frames'][$frame]['vars']);
            }
        }

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

    public static function scrubSdkEvent(Event $event): Event
    {
        $clean = self::scrub(['request' => $event->getRequest()]);
        $event->setRequest($clean['request'])->setMessage('[REDACTED]')->setExtra([]);
        $event->setUser($event->getUser() ? new UserDataBag($event->getUser()->getId()) : null);
        foreach ($event->getExceptions() as $exception) {
            $exception->setValue('[REDACTED]');
            foreach ($exception->getStacktrace()?->getFrames() ?? [] as $frame) {
                $frame->setVars([]);
            }
        }
        $event->setBreadcrumb(array_map(function (Breadcrumb $breadcrumb): Breadcrumb {
            $clean = self::scrubBreadcrumb(['data' => $breadcrumb->getMetadata()]);

            return new Breadcrumb($breadcrumb->getLevel(), $breadcrumb->getType(), $breadcrumb->getCategory(), null, $clean['data'] ?? [], $breadcrumb->getTimestamp());
        }, $event->getBreadcrumbs()));
        foreach ($event->getContexts() as $name => $context) {
            $event->setContext($name, $name === 'trace' ? array_intersect_key($context, array_flip(['trace_id', 'span_id', 'parent_span_id', 'op', 'status'])) : []);
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
        $parts = parse_url($url);
        if ($parts === false || (isset($parts['scheme']) && ! in_array($parts['scheme'], ['http', 'https'], true))) {
            return '[REDACTED]';
        }
        $path = '/'.ltrim($parts['path'] ?? '', '/');

        foreach (self::PUBLIC_TOKEN_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                $path = $prefix.'[REDACTED]';
                break;
            }
        }

        $path = preg_replace('~^(/?(?:api/)?email/verify/).*~', '$1[REDACTED]', $path);
        $path = preg_replace('~^(/storage/).*~', '$1[REDACTED]', $path);
        $origin = isset($parts['host']) ? ($parts['scheme'] ?? 'https').'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '') : '';
        $query = '';
        if (isset($parts['query'])) {
            $query = preg_match('/\A(?:page|per_page)=\d+(?:&(?:page|per_page)=\d+)*\z/', $parts['query']) ? '?'.$parts['query'] : '?[REDACTED]';
        }

        return $origin.$path.$query;
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

            $crumb['data'] = array_intersect_key($data, array_flip(['url', 'method', 'status_code', 'duration_ms']));
        }

        unset($crumb['message']);

        return $crumb;
    }
}
