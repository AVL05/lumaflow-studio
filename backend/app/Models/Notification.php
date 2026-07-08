<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'type', 'title', 'message', 'link', 'read_at'])]
class Notification extends Model
{
    use HasFactory;

    public const TYPES = ['success', 'warning', 'error', 'info', 'system'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeType($query, ?string $type)
    {
        return $query->when($type, fn ($builder) => $builder->where('type', $type));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
