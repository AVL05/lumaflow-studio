<?php

namespace App\Services;

use App\Models\Photo;
use App\Models\User;

class AiAssistantService
{
    public function analyzePhoto(User $user, string $prompt, ?Photo $photo = null): array
    {
        return [
            'provider' => 'mock',
            'future_provider' => 'ollama',
            'summary' => 'La imagen parece adecuada para un flujo editorial con contraste controlado y ajuste calido moderado.',
            'score' => 84,
            'recommendations' => [
                'Aumentar claridad de forma sutil para preservar textura.',
                'Evitar levantar sombras en exceso si buscas un look cinematografico.',
                'Probar preset warm o cinematic como punto de partida.',
            ],
            'context' => [
                'user_id' => $user->id,
                'photo_id' => $photo?->id,
                'prompt' => $prompt,
            ],
        ];
    }

    public function assistant(User $user, string $prompt): array
    {
        return [
            'provider' => 'mock',
            'future_provider' => 'ollama',
            'answer' => 'Para esta fase, organiza primero sesiones planificadas, marca equipo favorito y sube fotos representativas. Cuando Ollama este integrado, estas entidades daran contexto real al asistente.',
            'suggested_actions' => [
                'Crear una sesion con fecha y tipo definidos.',
                'Registrar camara y lente principal como favoritos.',
                'Subir una foto de referencia para analisis futuro.',
            ],
            'context' => [
                'user_id' => $user->id,
                'prompt' => $prompt,
            ],
        ];
    }
}
