<?php

namespace App\Services;

use App\Models\Preset;
use App\Models\User;
use Illuminate\Support\Arr;

class PresetGeneratorService
{
    public function __construct(
        private readonly OllamaService $ollama,
        private readonly AiContextService $context,
        private readonly PromptBuilderService $prompts,
    ) {}

    public function generate(User $user, array $input): Preset
    {
        $result = $this->ollama->json($this->prompts->preset(
            $this->context->forUser($user, ['task' => 'preset_generation'] + $input),
            $input
        ));

        $preset = $user->presets()->create($this->normalize($result, $input));

        $user->aiAnalyses()->create([
            'type' => 'preset_generation',
            'prompt' => json_encode($input, JSON_UNESCAPED_UNICODE),
            'result' => ['preset_id' => $preset->id, 'preset' => $preset->toArray()],
            'summary' => 'Preset generado: '.$preset->name,
            'score' => null,
        ]);

        return $preset;
    }

    private function normalize(array $result, array $input): array
    {
        $numeric = ['contrast', 'shadows', 'highlights', 'whites', 'blacks', 'clarity', 'texture', 'saturation', 'vibrance', 'temperature', 'tint', 'vignette'];
        $zeroToHundred = ['intensity', 'sharpness', 'noise_reduction', 'grain'];
        $payload = [
            'name' => (string) ($result['name'] ?? 'AI '.$input['style']),
            'description' => (string) ($result['description'] ?? 'Preset generado con Ollama.'),
            'category' => $this->allowed($result['category'] ?? 'color', ['color', 'black_white', 'portrait', 'outdoor', 'indoor', 'product', 'social', 'client', 'experimental'], 'color'),
            'style' => $this->allowed($result['style'] ?? 'custom', ['cinematic', 'moody', 'urban', 'street', 'portrait', 'wedding', 'landscape', 'nature', 'automotive', 'product', 'editorial', 'documentary', 'travel', 'black_white', 'warm', 'cold', 'minimal', 'film', 'vintage', 'custom'], 'custom'),
            'recommended_use' => (string) ($result['recommended_use'] ?? ''),
            'is_favorite' => false,
            'color' => preg_match('/^#[0-9a-fA-F]{6}$/', (string) ($result['color'] ?? '')) ? $result['color'] : '#d6b16a',
            'version' => (string) ($result['version'] ?? '1.0'),
        ];

        foreach ($numeric as $key) {
            $payload[$key] = max(-100, min(100, (int) ($result[$key] ?? 0)));
        }

        foreach ($zeroToHundred as $key) {
            $payload[$key] = max(0, min(100, (int) ($result[$key] ?? 0)));
        }

        return Arr::only($payload, ['name', 'description', 'category', 'style', 'contrast', 'shadows', 'highlights', 'whites', 'blacks', 'clarity', 'texture', 'intensity', 'saturation', 'vibrance', 'temperature', 'tint', 'sharpness', 'noise_reduction', 'grain', 'vignette', 'recommended_use', 'is_favorite', 'color', 'version']);
    }

    private function allowed(string $value, array $allowed, string $fallback): string
    {
        return in_array($value, $allowed, true) ? $value : $fallback;
    }
}
