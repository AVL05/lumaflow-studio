<?php

namespace App\Services;

use App\Models\User;

class RecommendationService
{
    public function contextFor(User $user): array
    {
        return [
            'sessions' => $user->sessions()
                ->select('name', 'date', 'time', 'session_type', 'status', 'location_name', 'client_name')
                ->latest('date')
                ->limit(8)
                ->get(),
            'gear' => $user->gearItems()
                ->select('name', 'category', 'brand', 'model', 'condition', 'is_favorite')
                ->orderByDesc('is_favorite')
                ->limit(12)
                ->get(),
            'presets' => $user->presets()
                ->select('name', 'category', 'style', 'contrast', 'shadows', 'temperature', 'saturation', 'clarity', 'grain', 'recommended_use', 'is_favorite', 'usage_count')
                ->orderByDesc('usage_count')
                ->limit(10)
                ->get(),
            'photos' => $user->photos()
                ->with(['session:id,name', 'albums:id,name', 'tags:id,name'])
                ->select('id', 'session_id', 'title', 'category', 'is_favorite', 'exif', 'taken_at')
                ->latest()
                ->limit(12)
                ->get(),
            'albums' => $user->albums()
                ->select('name', 'description', 'date')
                ->withCount('photos')
                ->latest()
                ->limit(8)
                ->get(),
            'tags' => $user->tags()
                ->select('name')
                ->withCount('photos')
                ->orderByDesc('photos_count')
                ->limit(20)
                ->get(),
            'locations' => $user->locations()
                ->select('name', 'city', 'country', 'latitude', 'longitude', 'type', 'best_time', 'access_difficulty', 'tags', 'recommended_gear')
                ->latest()
                ->limit(12)
                ->get(),
            'clients' => $user->clients()
                ->select('name', 'company', 'status', 'notes')
                ->latest()
                ->limit(12)
                ->get(),
            'deliveries' => $user->deliveries()
                ->with(['client:id,name', 'session:id,name'])
                ->select('id', 'client_id', 'session_id', 'title', 'status', 'budget', 'delivery_date')
                ->latest()
                ->limit(12)
                ->get(),
        ];
    }

    public function systemPrompt(): string
    {
        return <<<'PROMPT'
Eres asistente fotografico profesional de LumaFlow Studio.
Especialista en composicion, iluminacion, edicion, organizacion, presets y flujo de trabajo.
Usa exclusivamente datos del usuario incluidos en contexto.
No inventes equipo, sesiones, fotos, albumes, tags ni presets.
No respondas fuera del ambito fotografico.
Puedes ayudar con equipo recomendado, planificacion de sesion, mejor preset, mejora de foto, checklist, organizacion, workflow y localizacion usando datos existentes.
Responde en espanol, claro, accionable y profesional.
PROMPT;
    }
}
