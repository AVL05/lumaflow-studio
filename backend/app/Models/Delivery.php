<?php

namespace App\Models;

use App\Models\Concerns\CleansUpWorkflowRelations;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

#[Fillable(['user_id', 'job_id', 'client_id', 'session_id', 'title', 'status', 'budget', 'payment_status', 'amount_paid', 'delivery_date', 'gallery_url', 'private_notes', 'public_token', 'client_message', 'client_responded_at'])]
class Delivery extends Model
{
    use CleansUpWorkflowRelations, HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Delivery $delivery): void {
            $delivery->public_token ??= Str::random(40);
        });
    }

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'delivery_date' => 'date',
            'client_responded_at' => 'datetime',
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

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject');
    }

    public function images(): HasMany
    {
        return $this->hasMany(DeliveryImage::class)->orderBy('position')->orderBy('id');
    }
}
