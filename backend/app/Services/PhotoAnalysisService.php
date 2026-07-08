<?php

namespace App\Services;

use App\Models\AiAnalysis;
use App\Models\Photo;
use App\Models\User;

class PhotoAnalysisService
{
    public function __construct(
        private readonly OllamaService $ollama,
        private readonly RecommendationService $recommendations,
    ) {}

    public function analyze(User $user, Photo $photo, ?string $prompt = null): AiAnalysis
    {
        $photo->load(['session', 'albums', 'tags']);
        $result = $this->ollama->json([
            ['role' => 'system', 'content' => $this->recommendations->systemPrompt()."\nDevuelve solo JSON valido con keys: score, composition, lighting, exposure, contrast, sharpness, whiteBalance, color, style, strengths, weaknesses, recommendations, presetSuggestion."],
            ['role' => 'user', 'content' => json_encode([
                'task' => 'Analiza esta fotografia usando metadata disponible. No inventes vision de pixeles.',
                'prompt' => $prompt,
                'photo' => [
                    'title' => $photo->title,
                    'description' => $photo->description,
                    'category' => $photo->category,
                    'session' => $photo->session?->name,
                    'albums' => $photo->albums->pluck('name'),
                    'tags' => $photo->tags->pluck('name'),
                    'exif' => $photo->exif,
                    'favorite' => $photo->is_favorite,
                ],
                'context' => $this->recommendations->contextFor($user),
            ], JSON_UNESCAPED_UNICODE)],
        ]);

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
            'lighting' => (string) ($result['lighting'] ?? ''),
            'exposure' => (string) ($result['exposure'] ?? ''),
            'contrast' => (string) ($result['contrast'] ?? ''),
            'sharpness' => (string) ($result['sharpness'] ?? ''),
            'whiteBalance' => (string) ($result['whiteBalance'] ?? ''),
            'color' => (string) ($result['color'] ?? ''),
            'style' => (string) ($result['style'] ?? ''),
            'strengths' => array_values($result['strengths'] ?? []),
            'weaknesses' => array_values($result['weaknesses'] ?? []),
            'recommendations' => array_values($result['recommendations'] ?? []),
            'presetSuggestion' => (string) ($result['presetSuggestion'] ?? ''),
        ];
    }
}
