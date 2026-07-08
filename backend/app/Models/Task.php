<?php

namespace App\Models;

use App\Models\Concerns\CleansUpWorkflowRelations;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable(['user_id', 'session_id', 'client_id', 'title', 'description', 'priority', 'status', 'due_date', 'due_time', 'completed_at', 'position'])]
class Task extends Model
{
    use CleansUpWorkflowRelations, HasFactory;

    public const STATUSES = ['todo', 'in_progress', 'waiting', 'completed', 'cancelled'];

    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    public const OPEN_STATUSES = ['todo', 'in_progress', 'waiting'];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($builder) => $builder->where(function ($inner) use ($search): void {
            $inner->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }));
    }

    public function scopeStatus($query, ?string $status)
    {
        return $query->when($status, fn ($builder) => $builder->where('status', $status));
    }

    public function scopePriority($query, ?string $priority)
    {
        return $query->when($priority, fn ($builder) => $builder->where('priority', $priority));
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', self::OPEN_STATUSES);
    }

    public function scopeBetween($query, ?string $from, ?string $to)
    {
        return $query
            ->when($from, fn ($builder) => $builder->whereDate('due_date', '>=', $from))
            ->when($to, fn ($builder) => $builder->whereDate('due_date', '<=', $to));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function reminders(): MorphMany
    {
        return $this->morphMany(Reminder::class, 'remindable');
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject');
    }
}
