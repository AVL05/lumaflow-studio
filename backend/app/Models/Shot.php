<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Validation\ValidationException;

#[Fillable(['user_id', 'workspace_id', 'job_id', 'session_id', 'location_id', 'scene', 'description', 'shot_type', 'camera_movement', 'focal_length', 'estimated_seconds', 'scheduled_time', 'notes', 'status', 'position', 'revision'])]
class Shot extends Model
{
    use BelongsToWorkspace;

    public const STATUSES = ['pending', 'ready', 'done', 'discarded'];

    protected function casts(): array
    {
        return ['estimated_seconds' => 'integer', 'position' => 'integer', 'revision' => 'integer'];
    }

    protected static function booted(): void
    {
        static::addGlobalScope('session_project', fn ($q) => $q->where(fn ($q) => $q->whereNull('shots.session_id')->orWhereExists(fn ($s) => $s->selectRaw('1')->from('sessions as shot_session')->whereColumn('shot_session.id', 'shots.session_id')->whereColumn('shot_session.job_id', 'shots.job_id'))));
        static::saving(function (Shot $shot): void {
            if ($shot->session_id && ! Session::query()->where('job_id', $shot->job_id)->whereKey($shot->session_id)->exists()) {
                throw ValidationException::withMessages(['session_id' => 'La jornada no pertenece a este proyecto.']);
            }
        });
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function gearItems(): BelongsToMany
    {
        return $this->belongsToMany(GearItem::class)->whereExists(fn ($q) => $q->selectRaw('1')->from('shots as gear_shot')->whereColumn('gear_shot.id', 'gear_item_shot.shot_id')->whereColumn('gear_shot.workspace_id', 'gear_items.workspace_id'));
    }
}
