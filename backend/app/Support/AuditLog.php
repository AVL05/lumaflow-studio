<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Punto unico de logging de dominio. Escribe siempre en el canal `lumaflow`
 * con un `event` estable, para poder filtrar por tipo sin parsear mensajes.
 *
 * Regla: nunca se registran passwords, tokens, cabeceras de autorizacion,
 * emails en claro ni el contenido de las conversaciones con la IA. Los emails
 * se reducen a un hash corto suficiente para correlacionar intentos.
 */
class AuditLog
{
    public static function authSucceeded(string $action, int $userId): void
    {
        self::write('info', "auth.{$action}", ['user_id' => $userId]);
    }

    public static function authFailed(string $email): void
    {
        self::write('warning', 'auth.failed', ['email_hash' => self::hash($email)]);
    }

    public static function registered(int $userId): void
    {
        self::write('info', 'auth.registered', ['user_id' => $userId]);
    }

    /** Errores de la capa IA. Se registra la causa, nunca el prompt del usuario. */
    public static function aiFailure(string $operation, string $reason, ?int $userId = null): void
    {
        self::write('error', 'ai.failed', [
            'operation' => $operation,
            'reason' => $reason,
            'user_id' => $userId,
        ]);
    }

    /** Fallos de envio de correo transaccional. Nunca se registra el cuerpo del mensaje. */
    public static function mailFailed(string $mailable, string $reason, ?int $userId = null): void
    {
        self::write('warning', 'mail.failed', [
            'mailable' => $mailable,
            'reason' => $reason,
            'user_id' => $userId,
        ]);
    }

    /** Excepciones no controladas que llegan al handler de la API. */
    public static function apiException(Throwable $exception, string $method, string $path, ?int $userId = null): void
    {
        self::write('error', 'api.exception', [
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
            'file' => $exception->getFile().':'.$exception->getLine(),
            'method' => $method,
            'path' => $path,
            'user_id' => $userId,
        ]);
    }

    private static function write(string $level, string $event, array $context): void
    {
        Log::channel('lumaflow')->{$level}($event, array_filter(
            $context,
            fn ($value) => $value !== null,
        ));
    }

    private static function hash(string $value): string
    {
        return substr(hash('sha256', mb_strtolower(trim($value))), 0, 12);
    }
}
