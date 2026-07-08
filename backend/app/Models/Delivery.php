<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'client_id', 'session_id', 'title', 'status', 'budget', 'delivery_date', 'gallery_url', 'private_notes'])]
class Delivery extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'delivery_date' => 'date',
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
                ->orWhere('gallery_url', 'like', "%{$search}%")
                ->orWhereHas('client', fn ($client) => $client->where('name', 'like', "%{$search}%"))
                ->orWhereHas('session', fn ($session) => $session->where('name', 'like', "%{$search}%"));
        }));
    }

    public function scopeStatus($query, ?string $status)
    {
        return $query->when($status, fn ($builder) => $builder->where('status', $status));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }
}
