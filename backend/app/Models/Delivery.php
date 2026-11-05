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
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

#[Fillable(['user_id', 'workspace_id', 'is_demo', 'job_id', 'client_id', 'session_id', 'title', 'status', 'budget', 'payment_status', 'amount_paid', 'delivery_date', 'gallery_url', 'gallery_provider', 'gallery_password', 'gallery_expires_at', 'private_notes', 'public_token', 'client_message', 'client_responded_at'])]
class Delivery extends Model
{
    use BelongsToWorkspace, CleansUpWorkflowRelations, HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Delivery $delivery): void {
            $delivery->public_token ??= Str::random(40);
        });
        static::saving(function (Delivery $delivery): void {
            if ($delivery->exists && $delivery->isDirty('status') && ! $delivery->isDirty('revision_number')) {
                if ($delivery->getOriginal('review_state') === 'approved' && in_array($delivery->status, ['pending', 'delivered'], true)) {
                    throw ValidationException::withMessages(['status' => 'Publica una nueva revisión para reabrir la entrega.']);
                }
                if ($delivery->status === 'approved') {
                    $delivery->review_state = 'approved';
                }
            }
            if ($delivery->exists && $delivery->isDirty(['job_id', 'client_id', 'session_id']) && $delivery->revisions()->where('published', true)->exists()) {
                throw ValidationException::withMessages(['client_id' => 'Crea otra entrega para cambiar el contexto de un historial publicado.']);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'delivery_date' => 'date',
            'gallery_expires_at' => 'date',
            'client_responded_at' => 'datetime',
            'portal_revoked_at' => 'datetime',
            'version' => 'integer',
            'revision_number' => 'integer',
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

    public function revisions(): HasMany
    {
        return $this->hasMany(DeliveryRevision::class);
    }
}
