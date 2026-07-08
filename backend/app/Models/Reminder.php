<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable(['user_id', 'remindable_type', 'remindable_id', 'remind_date', 'remind_time', 'message', 'type', 'status'])]
class Reminder extends Model
{
    use HasFactory;

    public const TYPES = ['session', 'client', 'delivery', 'task', 'custom'];

    public const STATUSES = ['pending', 'done', 'dismissed'];

    protected function casts(): array
    {
        return [
            'remind_date' => 'date',
        ];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($builder) => $builder->where('message', 'like', "%{$search}%"));
    }

    public function scopeStatus($query, ?string $status)
    {
        return $query->when($status, fn ($builder) => $builder->where('status', $status));
    }

    public function scopeBetween($query, ?string $from, ?string $to)
    {
        return $query
            ->when($from, fn ($builder) => $builder->whereDate('remind_date', '>=', $from))
            ->when($to, fn ($builder) => $builder->whereDate('remind_date', '<=', $to));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function remindable(): MorphTo
    {
        return $this->morphTo();
    }
}
