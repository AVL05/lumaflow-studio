<?php

namespace App\Services;

use App\Models\Checklist;
use App\Models\ChecklistItem;
use Illuminate\Support\Facades\DB;

class ChecklistService
{
    /** Plantillas base disponibles al crear una checklist tipada. */
    public const TEMPLATES = [
        'gear' => ['Camara y baterias', 'Objetivos', 'Tarjetas SD formateadas', 'Tripode', 'Iluminacion', 'Filtros'],
        'preparation' => ['Confirmar hora con cliente', 'Revisar localizacion', 'Comprobar prevision meteorologica', 'Preparar moodboard', 'Firmar cesion de imagen'],
        'editing' => ['Importar y respaldar RAW', 'Seleccion inicial', 'Aplicar preset base', 'Retoque de piel', 'Exportar alta resolucion', 'Exportar redes sociales'],
        'delivery' => ['Preparar galeria', 'Revisar seleccion final', 'Subir entrega', 'Enviar enlace al cliente', 'Solicitar aprobacion'],
        'custom' => [],
    ];

    public function createWithTemplate(int $userId, array $attributes): Checklist
    {
        return DB::transaction(function () use ($userId, $attributes): Checklist {
            $checklist = Checklist::create([
                'user_id' => $userId,
                'session_id' => $attributes['session_id'] ?? null,
                'name' => $attributes['name'],
                'type' => $attributes['type'],
                'position' => $this->nextChecklistPosition($userId, $attributes['session_id'] ?? null),
            ]);

            $items = $attributes['items'] ?? (($attributes['use_template'] ?? false) ? self::TEMPLATES[$checklist->type] : []);

            foreach (array_values($items) as $index => $title) {
                $checklist->items()->create(['title' => $title, 'position' => $index]);
            }

            return $checklist;
        });
    }

    public function duplicate(Checklist $checklist): Checklist
    {
        return DB::transaction(function () use ($checklist): Checklist {
            $copy = Checklist::create([
                'user_id' => $checklist->user_id,
                'session_id' => $checklist->session_id,
                'name' => $checklist->name.' (copia)',
                'type' => $checklist->type,
                'position' => $this->nextChecklistPosition($checklist->user_id, $checklist->session_id),
            ]);

            $copy->items()->createMany(
                $checklist->items->map(fn (ChecklistItem $item) => [
                    'title' => $item->title,
                    'is_completed' => false,
                    'position' => $item->position,
                ])->all()
            );

            return $copy;
        });
    }

    /** Reordena items con una unica escritura por item, dentro de transaccion. */
    public function reorderItems(Checklist $checklist, array $orderedIds): void
    {
        DB::transaction(function () use ($checklist, $orderedIds): void {
            foreach (array_values($orderedIds) as $index => $id) {
                $checklist->items()->whereKey($id)->update(['position' => $index]);
            }
        });
    }

    public function toggleItem(ChecklistItem $item, bool $completed): ChecklistItem
    {
        $item->update([
            'is_completed' => $completed,
            'completed_at' => $completed ? now() : null,
        ]);

        return $item->refresh();
    }

    private function nextChecklistPosition(int $userId, ?int $sessionId): int
    {
        return (int) Checklist::query()
            ->where('user_id', $userId)
            ->where('session_id', $sessionId)
            ->max('position') + 1;
    }
}
