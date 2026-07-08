<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class OllamaService
{
    public function status(): array
    {
        try {
            $response = Http::timeout($this->timeout())->retry(1, 250)->get($this->url().'/api/tags');

            return [
                'available' => $response->successful(),
                'url' => $this->url(),
                'model' => $this->model(),
                'models' => $response->json('models', []),
                'error' => $response->successful() ? null : $response->body(),
            ];
        } catch (ConnectionException $exception) {
            return [
                'available' => false,
                'url' => $this->url(),
                'model' => $this->model(),
                'models' => [],
                'error' => $exception->getMessage(),
            ];
        }
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
            Log::warning('Ollama connection failed', ['error' => $exception->getMessage()]);
            throw new RuntimeException('Ollama no disponible.');
        }

        if (! $response->successful()) {
            Log::warning('Ollama request failed', ['status' => $response->status(), 'body' => $response->body()]);
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
            Log::warning('Ollama JSON parse failed', ['content' => $content]);
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
