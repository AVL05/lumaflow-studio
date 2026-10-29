<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable(['user_id', 'workspace_id', 'subject_type', 'subject_id', 'type', 'description', 'properties'])]
class Activity extends Model
{
    use BelongsToWorkspace, HasFactory;

    protected static function booted(): void
    {
        static::addGlobalScope('subject_workspace', function ($query): void {
            $query->where(function ($query): void {
                foreach ([Job::class, Session::class, Task::class, Client::class, Delivery::class, Contract::class] as $subject) {
                    $table = (new $subject)->getTable();
                    $query->orWhere(function ($query) use ($subject, $table): void {
                        $query->where('activities.subject_type', (new $subject)->getMorphClass())
                            ->whereExists(function ($related) use ($table): void {
                                $related->selectRaw('1')->from($table)
                                    ->whereColumn("{$table}.id", 'activities.subject_id')
                                    ->whereColumn("{$table}.workspace_id", 'activities.workspace_id');
                            });
                    });
                }
            });
        });
    }

    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForSubject($query, string $type, int $id)
    {
        return $query->where('subject_type', $type)->where('subject_id', $id);
    }

    public function scopeType($query, ?string $type)
    {
        return $query->when($type, fn ($builder) => $builder->where('type', $type));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}
