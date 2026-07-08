<?php

namespace App\Services;

use App\Support\AuditLog;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OllamaService
{
    /** El dashboard consulta el estado en cada carga: se cachea para no pagar la red. */
    private const STATUS_TTL = 15;

    /** Sonda de disponibilidad, no inferencia: no debe heredar el timeout largo del chat. */
    private const STATUS_TIMEOUT = 3;

    public function status(): array
    {
        return Cache::remember('ollama:status', self::STATUS_TTL, function (): array {
            try {
                $response = Http::timeout(self::STATUS_TIMEOUT)->get($this->url().'/api/tags');

                return [
                    'available' => $response->successful(),
                    'url' => $this->url(),
                    'model' => $this->model(),
                    'models' => $response->json('models', []),
                    'error' => $response->successful() ? null : 'HTTP '.$response->status(),
                ];
            } catch (ConnectionException $exception) {
                AuditLog::aiFailure('status', class_basename($exception));

                return [
                    'available' => false,
                    'url' => $this->url(),
                    'model' => $this->model(),
                    'models' => [],
                    'error' => 'unreachable',
                ];
            }
        });
    }

    public function chat(array $messages, array $options = []): array
    {
        try {
            $payload = [
                'model' => $this->model(),
                'messages' => $messages,
                'stream' => (bool) ($options['stream'] ?? false),
                'options' => [
                    'temperature' => $options['temperature'] ?? 0.45,
                ],
            ];

            if (isset($options['format'])) {
                $payload['format'] = $options['format'];
            }

            $response = Http::timeout($this->timeout())
                ->retry(2, 350, throw: false)
                ->post($this->url().'/api/chat', $payload);
        } catch (ConnectionException $exception) {
            AuditLog::aiFailure('chat', 'connection_failed');
            throw new RuntimeException('Ollama no disponible.');
        }

        if (! $response->successful()) {
            // No se registra el cuerpo: puede contener el prompt del usuario.
            AuditLog::aiFailure('chat', 'http_'.$response->status());
            throw new RuntimeException('Ollama devolvio error '.$response->status().'.');
        }

        return $response->json();
    }

    public function streamingAvailable(): bool
    {
        return true;
    }

    public function json(array $messages): array
    {
        $response = $this->chat($messages, ['format' => 'json', 'temperature' => 0.2]);
        $content = $response['message']['content'] ?? '{}';
        $decoded = json_decode($content, true) ?: json_decode($this->extractJson($content), true);

        if (! is_array($decoded)) {
            AuditLog::aiFailure('json', 'invalid_json');
            throw new RuntimeException('Ollama no devolvio JSON valido.');
        }

        return $decoded;
    }

    private function url(): string
    {
        return rtrim(config('ollama.url'), '/');
    }

    private function model(): string
    {
        return config('ollama.model');
    }

    private function timeout(): int
    {
        return max(5, (int) config('ollama.timeout'));
    }

    private function extractJson(string $content): string
    {
        if (preg_match('/\{.*\}/s', $content, $matches)) {
            return $matches[0];
        }

        return '{}';
    }
}
