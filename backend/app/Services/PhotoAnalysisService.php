<?php

namespace App\Services;

use App\Models\AiAnalysis;
use App\Models\Photo;
use App\Models\User;

class PhotoAnalysisService
{
    public function __construct(
        private readonly OllamaService $ollama,
        private readonly AiContextService $context,
        private readonly PromptBuilderService $prompts,
    ) {}

    public function analyze(User $user, Photo $photo, ?string $prompt = null): AiAnalysis
    {
        $photo->load(['session', 'albums', 'tags']);
        $photoPayload = [
            'title' => $photo->title,
            'description' => $photo->description,
            'category' => $photo->category,
            'session' => $photo->session?->name,
            'albums' => $photo->albums->pluck('name')->values(),
            'tags' => $photo->tags->pluck('name')->values(),
            'exif' => $photo->exif,
            'favorite' => $photo->is_favorite,
        ];

        $result = $this->ollama->json($this->prompts->photoAnalysis(
            $this->context->forUser($user, ['photo_id' => $photo->id]),
            $photoPayload,
            $prompt
        ));

        $normalized = $this->normalize($result);

        return $user->aiAnalyses()->create([
            'photo_id' => $photo->id,
            'type' => 'photo_analysis',
            'prompt' => $prompt ?? 'Analisis fotografico',
            'result' => $normalized,
            'summary' => $normalized['recommendations'][0] ?? 'Analisis completado.',
            'score' => $normalized['score'],
        ]);
    }

    private function normalize(array $result): array
    {
        return [
            'score' => (int) ($result['score'] ?? 0),
            'composition' => (string) ($result['composition'] ?? ''),
            'ruleOfThirds' => (string) ($result['ruleOfThirds'] ?? ''),
            'horizon' => (string) ($result['horizon'] ?? ''),
            'symmetry' => (string) ($result['symmetry'] ?? ''),
            'depth' => (string) ($result['depth'] ?? ''),
            'exposure' => (string) ($result['exposure'] ?? ''),
            'highlights' => (string) ($result['highlights'] ?? ''),
            'shadows' => (string) ($result['shadows'] ?? ''),
            'contrast' => (string) ($result['contrast'] ?? ''),
            'sharpness' => (string) ($result['sharpness'] ?? ''),
            'noise' => (string) ($result['noise'] ?? ''),
            'color' => (string) ($result['color'] ?? ''),
            'whiteBalance' => (string) ($result['whiteBalance'] ?? ''),
            'visualStyle' => (string) ($result['visualStyle'] ?? $result['style'] ?? ''),
            'strengths' => array_values($result['strengths'] ?? []),
            'detectedErrors' => array_values($result['detectedErrors'] ?? $result['weaknesses'] ?? []),
            'improvements' => array_values($result['improvements'] ?? $result['recommendations'] ?? []),
            'recommendedGear' => array_values($result['recommendedGear'] ?? []),
            'recommendedPreset' => (string) ($result['recommendedPreset'] ?? $result['presetSuggestion'] ?? ''),
            'estimatedDifficulty' => (string) ($result['estimatedDifficulty'] ?? ''),
            'recommendations' => array_values($result['improvements'] ?? $result['recommendations'] ?? []),
        ];
    }
}
