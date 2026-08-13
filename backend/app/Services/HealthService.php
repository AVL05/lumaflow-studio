<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Sondas de salud de las dependencias externas. Cada sonda captura sus propios
 * fallos: una dependencia caida degrada el estado, nunca tumba el endpoint.
 */
class HealthService
{
    public function __construct(private readonly OllamaService $ollama) {}

    /** Version publica y coarse: sin detalles internos. */
    public function summary(): array
    {
        $checks = [
            'api' => ['status' => 'up'],
            'database' => $this->database(),
            'storage' => $this->storage(),
            'cache' => $this->cache(),
            'ollama' => $this->ollamaProbe(),
        ];

        return [
            'status' => $this->aggregate($checks),
            'checks' => array_map(fn (array $check) => ['status' => $check['status']], $checks),
            'timestamp' => now()->toISOString(),
        ];
    }

    /** Version autenticada: incluye latencias, driver y modelo de IA. */
    public function detailed(): array
    {
        $checks = [
            'api' => ['status' => 'up', 'environment' => app()->environment(), 'laravel' => app()->version(), 'php' => PHP_VERSION],
            'database' => $this->database(),
            'storage' => $this->storage(),
            'cache' => $this->cache(),
            'ollama' => $this->ollamaProbe(),
        ];

        return [
            'status' => $this->aggregate($checks),
            'checks' => $checks,
            'timestamp' => now()->toISOString(),
        ];
    }

    private function database(): array
    {
        return $this->probe(function (): array {
            DB::connection()->select('select 1');

            return ['driver' => DB::connection()->getDriverName(), 'database' => DB::connection()->getDatabaseName()];
        });
    }

    private function storage(): array
    {
        return $this->probe(function (): array {
            $diskName = config('filesystems.default');
            $disk = Storage::disk($diskName);
            $file = 'health/'.uniqid('probe_', true).'.txt';

            $disk->put($file, 'ok');
            $readable = $disk->get($file) === 'ok';
            $disk->delete($file);

            abort_unless($readable, 500);

            // El enlace solo aplica al disco local publico; S3/R2 no lo necesita.
            return [
                'disk' => $diskName,
                'linked' => $diskName === 'public' ? file_exists(public_path('storage')) : null,
            ];
        });
    }

    private function cache(): array
    {
        return $this->probe(function (): array {
            $key = 'health:probe';
            Cache::put($key, 'ok', 5);
            $hit = Cache::get($key) === 'ok';
            Cache::forget($key);

            abort_unless($hit, 500);

            return ['store' => config('cache.default')];
        });
    }

    /** Ollama es opcional: si no responde el sistema queda "degraded", no "down". */
    private function ollamaProbe(): array
    {
        $started = microtime(true);

        try {
            $status = $this->ollama->status();
        } catch (Throwable $exception) {
            return [
                'status' => 'degraded',
                'error' => class_basename($exception),
                'latency_ms' => $this->elapsed($started),
            ];
        }

        return [
            'status' => $status['available'] ? 'up' : 'degraded',
            'model' => $status['model'],
            'url' => $status['url'],
            'models' => count($status['models'] ?? []),
            'latency_ms' => $this->elapsed($started),
        ];
    }

    private function probe(callable $check): array
    {
        $started = microtime(true);

        try {
            return ['status' => 'up', ...$check(), 'latency_ms' => $this->elapsed($started)];
        } catch (Throwable $exception) {
            return ['status' => 'down', 'error' => class_basename($exception), 'latency_ms' => $this->elapsed($started)];
        }
    }

    private function aggregate(array $checks): string
    {
        $statuses = array_column($checks, 'status');

        if (in_array('down', $statuses, true)) {
            return 'down';
        }

        return in_array('degraded', $statuses, true) ? 'degraded' : 'up';
    }

    private function elapsed(float $started): float
    {
        return round((microtime(true) - $started) * 1000, 1);
    }
}
