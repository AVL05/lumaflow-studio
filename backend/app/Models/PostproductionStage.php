<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

#[Fillable(['user_id', 'workspace_id', 'job_id', 'key', 'label', 'position', 'status', 'assigned_user_id', 'due_date', 'notes', 'revision'])]
class PostproductionStage extends Model
{
    use BelongsToWorkspace;

    protected $attributes = ['revision' => 0, 'status' => 'pending'];

    public const STATUSES = ['pending', 'in_progress', 'completed', 'skipped'];

    protected static function booted(): void
    {
        static::saving(fn (PostproductionStage $stage) => self::validateAssignee($stage->assigned_user_id, $stage->workspace_id));
    }

    protected function casts(): array
    {
        return ['due_date' => 'date', 'revision' => 'integer', 'position' => 'integer'];
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'stage_id')->orderBy('position')->orderBy('id');
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class, 'stage_id')->orderBy('position')->orderBy('id');
    }

    public static function validateAssignee(?int $userId, ?int $workspaceId): void
    {
        if ($userId && ! WorkspaceMembership::query()->where('workspace_id', $workspaceId)->where('user_id', $userId)->exists()) {
            throw ValidationException::withMessages(['assigned_user_id' => 'El responsable no está disponible en este estudio.']);
        }
    }

    public static function contentChanged(?int $stageId, bool $reopen): void
    {
        if (! $stageId) {
            return;
        }
        static::query()->whereKey($stageId)->update([
            'revision' => DB::raw('revision + 1'),
            ...($reopen ? ['status' => DB::raw("CASE WHEN status = 'completed' THEN 'in_progress' ELSE status END")] : []),
        ]);
    }
}
