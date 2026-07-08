<?php

namespace App\Services;

use App\Models\AiAnalysis;
use App\Models\User;

class RecommendationService
{
    public function __construct(
        private readonly OllamaService $ollama,
        private readonly AiContextService $context,
        private readonly PromptBuilderService $prompts,
    ) {}

    public function recommendGear(User $user, array $input): AiAnalysis
    {
        $result = $this->ollama->json($this->prompts->gearRecommendation(
            $this->context->forUser($user, ['task' => 'gear_recommendation'] + $input),
            $input
        ));

        return $user->aiAnalyses()->create([
            'type' => 'gear_recommendation',
            'prompt' => json_encode($input, JSON_UNESCAPED_UNICODE),
            'result' => $result,
            'summary' => $result['setupNotes'] ?? 'Recomendacion de equipo generada.',
            'score' => null,
        ]);
    }

    public function contextFor(User $user): array
    {
        return $this->context->forUser($user);
    }

    public function systemPrompt(): string
    {
        return $this->prompts->systemPrompt();
    }
}
