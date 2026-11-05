<?php

namespace App\Services;

use App\Models\Job;
use App\Models\PostproductionStage;
use App\Models\ProjectTemplate;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JobWorkflowService
{
    public static function phaseFor(string $status): ?string
    {
        return match ($status) {
            'shoot' => 'production',
            'editing', 'review' => 'postproduction',
            'delivered', 'closed' => 'delivery',
            'cancelled' => null,
            default => 'preparation',
        };
    }

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
        if (in_array($job->workflow_key, ['general', 'other'], true) && in_array($job->project_type, ['audiovisual', 'personal'], true)) {
            $template['tasks'] = ['Definir intención y briefing', 'Preparar producción y equipo', 'Revisar edición', 'Preparar entrega'];
        }
        foreach ($template['tasks'] as $position => $title) {
            $job->tasks()->create([
                'user_id' => $job->user_id,
                'workspace_id' => $job->workspace_id,
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

    public function template(Job $job, string $key): array
    {
        if (str_starts_with($key, 'custom-')) {
            abort_unless(preg_match('/^custom-\d+$/', $key), 404);
            $template = ProjectTemplate::query()->where('workspace_id', $job->workspace_id)->when(DB::transactionLevel() > 0, fn ($q) => $q->lockForUpdate())->findOrFail((int) substr($key, 7));

            return ['key' => 'custom-'.$template->id, ...$template->only(['name', 'description', 'definition', 'revision'])];
        }

        return config('project_templates.'.$key) ?? abort(404);
    }

    public function preview(Job $job, array $template): array
    {
        $existing = [
            'stages' => $job->stages()->get(['id', 'key', 'label'])->toArray(),
            'tasks' => $job->tasks()->orderBy('id')->get(['id', 'title', 'stage_id'])->toArray(),
            'checklists' => $job->checklists()->with('items:id,checklist_id,title')->orderBy('id')->get(['id', 'name', 'stage_id'])->toArray(),
        ];
        $plan = ['stages' => [], 'tasks' => [], 'checklists' => []];
        $normalize = fn ($text) => $this->normalizeTitle($text);
        $taskNames = collect($existing['tasks'])->keyBy(fn ($t) => $normalize($t['title']));
        $checkNames = collect($existing['checklists'])->keyBy(fn ($c) => $normalize($c['name']));
        $stageKeys = collect($existing['stages'])->keyBy('key');
        $task = function (string $title, ?string $stage, string $phase) use (&$plan, &$taskNames, $normalize): void {
            $key = $normalize($title);
            $match = $taskNames->get($key);
            $plan['tasks'][] = ['title' => $title, 'stage_key' => $stage, 'phase' => $phase, 'action' => $match ? 'reuse' : 'create', 'existing_id' => $match['id'] ?? null];
            $taskNames->put($key, $match ?? ['id' => null]);
        };
        $checklist = function (array $check, ?string $stage) use (&$plan, &$checkNames, $normalize): void {
            $key = $normalize($check['name']);
            $match = $checkNames->get($key);
            $seen = collect($match['items'] ?? [])->map(fn ($item) => $normalize($item['title']))->all();
            $items = [];
            foreach ($check['items'] as $title) {
                $itemKey = $normalize($title);
                $items[] = ['title' => $title, 'action' => in_array($itemKey, $seen, true) ? 'reuse' : 'create'];
                $seen[] = $itemKey;
            }
            $plan['checklists'][] = $check + ['stage_key' => $stage, 'action' => $match ? 'reuse' : 'create', 'existing_id' => $match['id'] ?? null, 'item_actions' => $items];
            $checkNames->put($key, ['id' => $match['id'] ?? null, 'items' => array_map(fn ($title) => ['title' => $title], $seen)]);
        };
        foreach ($template['definition']['tasks'] as $item) {
            $task($item['title'], null, $item['phase']);
        }
        foreach ($template['definition']['checklists'] as $item) {
            $checklist($item, null);
        }
        foreach ($template['definition']['stages'] as $stage) {
            $plan['stages'][] = ['key' => $stage['key'], 'label' => $stage['label'], 'action' => $stageKeys->has($stage['key']) ? 'reuse' : 'create'];
            foreach ($stage['tasks'] as $title) {
                $task($title, $stage['key'], $stage['key'] === 'delivered' ? 'delivery' : 'postproduction');
            }
            foreach ($stage['checklists'] as $item) {
                $checklist($item, $stage['key']);
            }
        }

        return [
            'template' => $template, 'plan' => $plan,
            'already_applied' => DB::table('project_template_applications')->where('job_id', $job->id)->where('template_key', $template['key'])->exists(),
            'hash' => hash('sha256', json_encode([$template, $existing], JSON_UNESCAPED_UNICODE)),
        ];
    }

    public function applyTemplate(User $actor, Job $job, string $key, string $hash): array
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404($actor, $job);

        return DB::transaction(function () use ($actor, $job, $key, $hash): array {
            app(ProductionService::class)->lockProject($job);
            $template = $this->template($job, $key);
            $preview = $this->preview($job, $template);
            if ($preview['already_applied']) {
                return ['already_applied' => true];
            }
            abort_unless(hash_equals($preview['hash'], $hash), 409, 'El proyecto o la plantilla han cambiado. Revisa de nuevo la previsualización.');
            foreach ($preview['plan']['stages'] as $stage) {
                if ($stage['action'] === 'create') {
                    $this->newStage($actor, $job, $stage['key'], $stage['label']);
                }
            }
            $stages = $job->stages()->get()->keyBy('key');
            $taskIndex = $job->tasks()->get()->keyBy(fn ($t) => $this->normalizeTitle($t->title));
            $position = (int) $job->tasks()->max('position');
            foreach ($preview['plan']['tasks'] as $item) {
                $stageId = $item['stage_key'] ? $stages[$item['stage_key']]->id : null;
                $existing = $taskIndex->get($this->normalizeTitle($item['title']));
                if ($existing) {
                    if ($stageId && ! $existing->stage_id) {
                        $existing->update(['stage_id' => $stageId]);
                    }

                    continue;
                }
                $taskIndex->put($this->normalizeTitle($item['title']), $job->tasks()->create(['user_id' => $actor->id, 'workspace_id' => $job->workspace_id, 'client_id' => $job->client_id, 'stage_id' => $stageId, 'title' => $item['title'], 'workflow_phase' => $item['phase'], 'priority' => 'medium', 'status' => 'todo', 'position' => ++$position]));
            }
            $checkIndex = $job->checklists()->with('items')->get()->keyBy(fn ($c) => $this->normalizeTitle($c->name));
            foreach ($preview['plan']['checklists'] as $item) {
                $existing = $checkIndex->get($this->normalizeTitle($item['name']));
                if ($existing) {
                    $items = $existing->items;
                    $position = (int) $items->max('position');
                    foreach ($item['items'] as $title) {
                        if (! $items->contains(fn ($control) => $this->normalizeTitle($control->title) === $this->normalizeTitle($title))) {
                            $items->push($existing->items()->create(['title' => $title, 'position' => ++$position]));
                        }
                    }

                    continue;
                }
                $checkIndex->put($this->normalizeTitle($item['name']), app(ChecklistService::class)->createWithTemplate($actor->id, ['job_id' => $job->id, 'stage_id' => $item['stage_key'] ? $stages[$item['stage_key']]->id : null, 'name' => $item['name'], 'type' => 'custom', 'items' => collect($item['items'])->unique(fn ($title) => $this->normalizeTitle($title))->values()->all()]));
            }
            DB::table('project_template_applications')->insert(['job_id' => $job->id, 'template_key' => $key, 'template_name' => $template['name'], 'template_revision' => $template['revision'], 'preview_hash' => $hash, 'created_at' => now()]);
            app(ActivityLogger::class)->log($actor, $job, 'template_applied', 'Plantilla aplicada.', ['template_key' => $key]);

            return ['already_applied' => false];
        }, 3);
    }

    public function initialize(User $actor, Job $job): void
    {
        DB::transaction(function () use ($actor, $job): void {
            app(ProductionService::class)->lockProject($job);
            foreach (config('project_templates.portrait.definition.stages') as $stage) {
                if (! $job->stages()->where('key', $stage['key'])->exists()) {
                    $this->newStage($actor, $job, $stage['key'], $stage['label']);
                }
            }
        }, 3);
    }

    public function createStage(User $actor, Job $job, array $data): PostproductionStage
    {
        return DB::transaction(function () use ($actor, $job, $data): PostproductionStage {
            app(ProductionService::class)->lockProject($job);

            return $this->newStage($actor, $job, 'custom-'.Str::lower(Str::random(12)), $data['label'], $data);
        }, 3);
    }

    private function newStage(User $actor, Job $job, string $key, string $label, array $extra = []): PostproductionStage
    {
        abort_if($job->stages()->count() >= 32, 422, 'El proyecto admite hasta 32 etapas. Reutiliza o renombra las existentes.');

        return $job->stages()->create(['user_id' => $actor->id, 'workspace_id' => $job->workspace_id, 'key' => $key, 'label' => $label, 'position' => (int) $job->stages()->max('position') + 1] + $extra);
    }

    public function updateStage(User $actor, Job $job, PostproductionStage $stage, array $data): PostproductionStage
    {
        return DB::transaction(function () use ($actor, $job, $stage, $data): PostproductionStage {
            app(ProductionService::class)->lockProject($job);
            $stage = $job->stages()->whereKey($stage->id)->firstOrFail();
            if (($data['status'] ?? null) === 'completed') {
                abort_if($stage->tasks()->open()->exists() || $stage->checklists()->whereHas('items', fn ($q) => $q->where('is_completed', false))->exists(), 422, 'Completa o cancela las tareas y revisa los checks antes de completar la etapa.');
            }
            $updated = PostproductionStage::query()->whereKey($stage->id)->where('revision', $data['revision'])->update(Arr::except($data, ['revision']) + ['revision' => DB::raw('revision + 1')]);
            abort_unless($updated, 409, 'La etapa ha cambiado. Conserva tu borrador y recarga.');
            app(ActivityLogger::class)->log($actor, $job, 'stage_updated', 'Etapa de postproducción actualizada.', ['stage_id' => $stage->id]);

            return $stage->refresh();
        }, 3);
    }

    public function moveStage(Job $job, PostproductionStage $stage, string $direction, int $revision): void
    {
        DB::transaction(function () use ($job, $stage, $direction, $revision): void {
            app(ProductionService::class)->lockProject($job);
            $stage = $job->stages()->whereKey($stage->id)->firstOrFail();
            abort_unless($stage->revision === $revision, 409, 'La etapa ha cambiado. Recarga el panel.');
            $neighbor = $job->stages()->reorder()->where('position', $direction === 'up' ? '<' : '>', $stage->position)->orderBy('position', $direction === 'up' ? 'desc' : 'asc')->first();
            if ($neighbor) {
                $position = $stage->position;
                $stage->update(['position' => $neighbor->position, 'revision' => $stage->revision + 1]);
                $neighbor->update(['position' => $position, 'revision' => $neighbor->revision + 1]);
            }
        }, 3);
    }

    private function normalizeTitle(string $title): string
    {
        return mb_strtolower(preg_replace('/\s+/u', ' ', trim($title)));
    }
}
