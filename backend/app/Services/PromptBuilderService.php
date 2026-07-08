<?php

namespace App\Services;

class PromptBuilderService
{
    public function systemPrompt(): string
    {
        return <<<'PROMPT'
Eres el asistente fotografico profesional de LumaFlow Studio.
Especialidad: composicion, iluminacion, edicion, direccion de sesiones, organizacion de biblioteca, presets y flujo de trabajo para fotografos.
Usa exclusivamente los datos del usuario incluidos en contexto. Si falta un dato, dilo y propone una accion segura.
No inventes equipo, clientes, localizaciones, fotografias, sesiones, albumes ni presupuestos.
No respondas fuera del ambito fotografico.
Responde en espanol, con criterio profesional, accionable y conciso.
PROMPT;
    }

    public function chat(array $context, string $message, array $history = []): array
    {
        return [
            ['role' => 'system', 'content' => $this->systemPrompt()],
            ['role' => 'user', 'content' => json_encode([
                'task' => 'Responder como asistente integrado de fotografia, no chatbot generico.',
                'context' => $context,
                'history' => $history,
                'message' => strip_tags($message),
            ], JSON_UNESCAPED_UNICODE)],
        ];
    }

    public function photoAnalysis(array $context, array $photo, ?string $prompt): array
    {
        return $this->jsonTask('Analiza fotografia con metadata disponible. No inventes vision de pixeles.', [
            'required_schema' => [
                'score', 'composition', 'ruleOfThirds', 'horizon', 'symmetry', 'depth', 'exposure',
                'highlights', 'shadows', 'color', 'whiteBalance', 'contrast', 'sharpness', 'noise',
                'visualStyle', 'strengths', 'detectedErrors', 'improvements', 'recommendedGear',
                'recommendedPreset', 'estimatedDifficulty',
            ],
            'context' => $context,
            'photo' => $photo,
            'prompt' => $prompt,
        ]);
    }

    public function preset(array $context, array $input): array
    {
        return $this->jsonTask('Genera un preset completo editable para LumaFlow.', [
            'required_schema' => [
                'name', 'description', 'category', 'style', 'contrast', 'shadows', 'highlights',
                'whites', 'blacks', 'clarity', 'texture', 'intensity', 'saturation', 'vibrance',
                'temperature', 'tint', 'sharpness', 'noise_reduction', 'grain', 'vignette',
                'recommended_use', 'color', 'version',
            ],
            'allowed_category' => ['color', 'black_white', 'portrait', 'outdoor', 'indoor', 'product', 'social', 'client', 'experimental'],
            'allowed_style' => ['cinematic', 'moody', 'urban', 'street', 'portrait', 'wedding', 'landscape', 'nature', 'automotive', 'product', 'editorial', 'documentary', 'travel', 'black_white', 'warm', 'cold', 'minimal', 'film', 'vintage', 'custom'],
            'numeric_ranges' => 'Ajustes entre -100 y 100 salvo intensity/sharpness/noise_reduction/grain entre 0 y 100.',
            'context' => $context,
            'input' => $input,
        ]);
    }

    public function gearRecommendation(array $context, array $input): array
    {
        return $this->jsonTask('Recomienda equipo usando solo equipo existente. Indica material faltante por separado.', [
            'required_schema' => ['recommendedGear', 'missingGear', 'setupNotes', 'packingChecklist', 'risks'],
            'context' => $context,
            'input' => $input,
        ]);
    }

    public function sessionPlan(array $context, array $session, array $input): array
    {
        return $this->jsonTask('Crea plan profesional asociado a una sesion real.', [
            'required_schema' => ['checklist', 'gear', 'objectives', 'timeline', 'ideas', 'risks', 'materials', 'tips', 'summary'],
            'context' => $context,
            'session' => $session,
            'input' => $input,
        ]);
    }

    private function jsonTask(string $task, array $payload): array
    {
        return [
            ['role' => 'system', 'content' => $this->systemPrompt()."\nDevuelve exclusivamente JSON valido. Sin markdown."],
            ['role' => 'user', 'content' => json_encode(['task' => $task] + $payload, JSON_UNESCAPED_UNICODE)],
        ];
    }
}
