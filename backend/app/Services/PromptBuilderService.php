<?php

namespace App\Services;

class PromptBuilderService
{
    public function systemPrompt(): string
    {
        return <<<'PROMPT'
Eres el asistente fotografico profesional de LumaFlow Studio.
Especialidad: composicion, iluminacion, direccion de sesiones y flujo de trabajo para fotografos.
Usa exclusivamente los datos del usuario incluidos en contexto. Si falta un dato, dilo y propone una accion segura.
No inventes equipo, clientes, localizaciones, sesiones ni presupuestos.
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
