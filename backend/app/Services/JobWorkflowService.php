<?php

namespace App\Services;

use App\Models\Job;

class JobWorkflowService
{
    public const PIPELINE = [
        'lead' => 'Lead', 'quoted' => 'Presupuesto', 'contract_pending' => 'Contrato',
        'confirmed' => 'Confirmado', 'preparation' => 'Preparación', 'shoot' => 'Sesión',
        'editing' => 'Edición', 'review' => 'Revisión', 'delivered' => 'Entregado', 'closed' => 'Cerrado',
    ];

    public const WORKFLOWS = [
        'wedding' => ['label' => 'Boda', 'tasks' => ['Reunión de descubrimiento', 'Preparar contrato', 'Confirmar localización y horarios', 'Preparar equipo', 'Enviar galería de revisión']],
        'portrait' => ['label' => 'Retrato', 'tasks' => ['Definir referencias y vestuario', 'Confirmar localización', 'Preparar equipo', 'Seleccionar y editar fotografías']],
        'family' => ['label' => 'Familia', 'tasks' => ['Enviar guía de preparación', 'Confirmar asistentes', 'Preparar equipo', 'Seleccionar y editar fotografías']],
        'events' => ['label' => 'Evento', 'tasks' => ['Confirmar agenda', 'Coordinar acreditaciones', 'Preparar equipo', 'Entregar selección urgente']],
        'product' => ['label' => 'Producto', 'tasks' => ['Recibir listado de productos', 'Definir estilismo', 'Preparar iluminación', 'Validar selección con cliente']],
        'automotive' => ['label' => 'Automoción', 'tasks' => ['Confirmar vehículo y estado', 'Revisar localización', 'Preparar equipo', 'Editar selección final']],
        'real_estate' => ['label' => 'Inmobiliaria', 'tasks' => ['Confirmar acceso al inmueble', 'Enviar guía de preparación', 'Preparar equipo', 'Entregar selección optimizada']],
        'other' => ['label' => 'Otra especialidad', 'tasks' => ['Confirmar briefing', 'Preparar sesión', 'Seleccionar y editar fotografías', 'Preparar entrega']],
        'general' => ['label' => 'General', 'tasks' => ['Confirmar briefing', 'Preparar sesión', 'Seleccionar y editar fotografías', 'Preparar entrega']],
    ];

    public function seedTasks(Job $job): void
    {
        $template = self::WORKFLOWS[$job->workflow_key] ?? self::WORKFLOWS['general'];
        foreach ($template['tasks'] as $position => $title) {
            $job->tasks()->create([
                'user_id' => $job->user_id,
                'client_id' => $job->client_id,
                'title' => $title,
                'priority' => 'medium',
                'status' => 'todo',
                'due_date' => $job->event_date?->copy()->subDays(max(1, count($template['tasks']) - $position)),
                'position' => $position,
            ]);
        }
    }

    public function catalog(): array
    {
        return ['pipeline' => self::PIPELINE, 'workflows' => self::WORKFLOWS];
    }
}
