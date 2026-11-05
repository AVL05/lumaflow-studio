<?php

namespace App\Models\Concerns;

use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceAuthorizer;
use App\Services\WorkspaceService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Conserva el workspace y rechaza asociaciones entre estudios, también
 * al leer datos anteriores al endurecimiento de validación.
 */
trait BelongsToWorkspace
{
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function scopeInWorkspace($query, ?int $workspaceId)
    {
        return $query->when($workspaceId, fn ($builder) => $builder->where('workspace_id', $workspaceId));
    }

    /**
     * Frontera de lectura del Issue #5: solo workspaces con membership.
     * Sustituye a `ownedBy()` en listados de recursos compartidos.
     */
    public function scopeAccessibleBy($query, User $user)
    {
        return $query->whereIn('workspace_id', app(WorkspaceAuthorizer::class)->workspaceIds($user));
    }

    protected static function bootBelongsToWorkspace(): void
    {
        static::addGlobalScope('workspace_integrity', function ($query): void {
            $model = $query->getModel();
            $table = $model->getTable();
            foreach ($model->workspaceReferences() as $field => $relatedTable) {
                $query->where(function ($query) use ($table, $field, $relatedTable, $model): void {
                    $query->whereNull("{$table}.{$field}")->orWhereExists(function ($related) use ($table, $field, $relatedTable, $model): void {
                        $related->selectRaw('1')->from("{$relatedTable} as workspace_relation")
                            ->whereColumn('workspace_relation.id', "{$table}.{$field}")
                            ->when($field === 'stage_id', fn ($stage) => $stage->whereColumn('workspace_relation.job_id', "{$table}.job_id"))
                            ->when($field === 'session_id' && in_array('stage_id', $model->getFillable(), true), fn ($session) => $session->where(fn ($scope) => $scope->whereNull("{$table}.stage_id")->orWhereColumn('workspace_relation.job_id', "{$table}.job_id")))
                            ->where(function ($scope) use ($table): void {
                                $scope->whereColumn('workspace_relation.workspace_id', "{$table}.workspace_id")
                                    ->orWhere(function ($legacy) use ($table): void {
                                        $legacy->whereNull('workspace_relation.workspace_id')->whereNull("{$table}.workspace_id")
                                            ->whereColumn('workspace_relation.user_id', "{$table}.user_id");
                                    });
                            });
                    });
                });
            }
        });

        static::saving(function (Model $model): void {
            $model->assignWorkspace();
            foreach ($model->workspaceReferences() as $field => $table) {
                if ($model->getAttribute($field) === null) {
                    continue;
                }
                $related = DB::table($table)->where('id', $model->getAttribute($field))
                    ->where('workspace_id', $model->workspace_id)
                    ->when($field === 'stage_id', fn ($stage) => $stage->where('job_id', $model->job_id))
                    ->when($field === 'session_id' && $model->getAttribute('stage_id'), fn ($session) => $session->where('job_id', $model->job_id))
                    ->when(! $model->workspace_id, fn ($query) => $query->where('user_id', $model->user_id));
                if (! $related->exists()) {
                    throw ValidationException::withMessages([$field => 'La referencia no está disponible en este estudio.']);
                }
            }
        });
    }

    public function workspaceReferences(): array
    {
        return array_intersect_key([
            'job_id' => 'photography_jobs', 'client_id' => 'clients', 'session_id' => 'sessions',
            'location_id' => 'locations', 'gear_item_id' => 'gear_items', 'quote_id' => 'quotes',
            'ai_conversation_id' => 'ai_conversations',
            'stage_id' => 'postproduction_stages',
        ], array_flip($this->getFillable()));
    }

    private function assignWorkspace(): void
    {
        if ($this->getAttribute('workspace_id') || ! $this->getAttribute('user_id')) {
            return;
        }
        $user = User::query()->find($this->getAttribute('user_id'));
        if ($user instanceof User) {
            $this->setAttribute('workspace_id', $user->current_workspace_id ?: app(WorkspaceService::class)->ensureForUser($user)->getKey());
        }
    }
}
