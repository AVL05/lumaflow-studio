<?php

namespace App\Services;

use App\Models\AiSessionPlan;
use App\Models\Session;
use App\Models\User;

class SessionPlannerService
{
    public function __construct(
        private readonly OllamaService $ollama,
        private readonly AiContextService $context,
        private readonly PromptBuilderService $prompts,
    ) {}

    public function plan(User $user, Session $session, array $input): AiSessionPlan
    {
        $session->load('location');
        $result = $this->ollama->json($this->prompts->sessionPlan(
            $this->context->forUser($user, ['task' => 'session_plan', 'session_id' => $session->id]),
            $session->toArray(),
            $input
        ));

        $plan = $user->aiSessionPlans()->create([
            'session_id' => $session->id,
            'title' => 'Plan IA - '.$session->name,
            'plan' => $result,
            'summary' => $result['summary'] ?? 'Plan de sesion generado.',
        ]);

        $user->aiAnalyses()->create([
            'type' => 'session_plan',
            'prompt' => json_encode(['session_id' => $session->id] + $input, JSON_UNESCAPED_UNICODE),
            'result' => ['plan_id' => $plan->id, 'plan' => $result],
            'summary' => $plan->summary,
            'score' => null,
        ]);

        return $plan;
    }
}
