<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Models\Concerns\CleansUpWorkflowRelations;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Validation\ValidationException;

#[Fillable(['user_id', 'workspace_id', 'is_demo', 'job_id', 'location_id', 'name', 'date', 'time', 'location_name', 'session_type', 'status', 'description', 'notes', 'client_name', 'end_time', 'participants', 'incidents'])]
class Session extends Model
{
    use BelongsToWorkspace, CleansUpWorkflowRelations, HasFactory;

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'participants' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Session $session): void {
            if ($session->end_time && (! $session->time || substr($session->end_time, 0, 5) < substr($session->time, 0, 5))) {
                throw ValidationException::withMessages(['end_time' => 'La hora final debe ser posterior al inicio, dentro del mismo día.']);
            }
            if ($session->exists && $session->isDirty('job_id') && $session->shots()->exists()) {
                throw ValidationException::withMessages(['job_id' => 'Retira las tomas asignadas antes de trasladar esta sesión.']);
            }
        });
    }

    public function shots(): HasMany
    {
        return $this->hasMany(Shot::class);
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($builder) => $builder->where(function ($inner) use ($search): void {
            $inner->where('name', 'like', "%{$search}%")
                ->orWhere('location_name', 'like', "%{$search}%")
                ->orWhere('client_name', 'like', "%{$search}%");
        }));
    }

    public function scopeStatus($query, ?string $status)
    {
        return $query->when($status, fn ($builder) => $builder->where('status', $status));
    }

    public function scopeType($query, ?string $type)
    {
        return $query->when($type, fn ($builder) => $builder->where('session_type', $type));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function aiPlans(): HasMany
    {
        return $this->hasMany(AiSessionPlan::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(Checklist::class)->orderBy('position')->orderBy('id');
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject');
    }
}
