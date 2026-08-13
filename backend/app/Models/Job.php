<?php

namespace App\Models;

use App\Models\Concerns\CleansUpWorkflowRelations;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable(['user_id', 'client_id', 'location_id', 'title', 'specialty', 'workflow_key', 'status', 'event_date', 'description', 'budget', 'deposit_amount', 'contract_status', 'contract_url', 'contract_signed_at'])]
class Job extends Model
{
    use CleansUpWorkflowRelations, HasFactory;

    protected $table = 'photography_jobs';

    public const STATUSES = ['lead', 'quoted', 'contract_pending', 'confirmed', 'preparation', 'shoot', 'editing', 'review', 'delivered', 'closed', 'cancelled'];

    public const CONTRACT_STATUSES = ['not_required', 'draft', 'sent', 'signed', 'declined'];

    protected function casts(): array
    {
        return ['event_date' => 'date', 'budget' => 'decimal:2', 'deposit_amount' => 'decimal:2', 'contract_signed_at' => 'datetime'];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($q) => $q->where(fn ($i) => $i->where('title', 'like', "%{$search}%")->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$search}%"))));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('position');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    public function gearItems(): BelongsToMany
    {
        return $this->belongsToMany(GearItem::class);
    }

    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject')->latest();
    }
}
