<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'name', 'email', 'phone', 'session_type', 'preferred_date', 'message', 'status'])]
class BookingRequest extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'preferred_date' => 'date',
        ];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeStatus($query, ?string $status)
    {
        return $query->when($status, fn ($builder) => $builder->where('status', $status));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
