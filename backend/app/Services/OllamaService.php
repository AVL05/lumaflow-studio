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
            $response = Http::timeout($this->timeout())->get($this->url().'/api/tags');

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
                'stream' => false,
            ];

            if (isset($options['format'])) {
                $payload['format'] = $options['format'];
            }

            $response = Http::timeout($this->timeout())
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

    public function json(array $messages): array
    {
        $response = $this->chat($messages, ['format' => 'json']);
        $content = $response['message']['content'] ?? '{}';
        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            Log::warning('Ollama JSON parse failed', ['content' => $content]);
            throw new RuntimeException('Ollama no devolvio JSON valido.');
        }

        return $decoded;
    }

    private function url(): string
    {
        return rtrim(config('services.ollama.url'), '/');
    }

    private function model(): string
    {
        return config('services.ollama.model');
    }

    private function timeout(): int
    {
        return max(5, (int) config('services.ollama.timeout'));
    }
}
