<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'session_id', 'name', 'type', 'position'])]
class Checklist extends Model
{
    use HasFactory;

    public const TYPES = ['gear', 'preparation', 'editing', 'delivery', 'custom'];

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ChecklistItem::class)->orderBy('position')->orderBy('id');
    }

    /** Relacion auxiliar para withCount('completedItems') y calcular progreso sin N+1. */
    public function completedItems(): HasMany
    {
        return $this->hasMany(ChecklistItem::class)->where('is_completed', true);
    }

    public function progress(): int
    {
        $total = $this->items_count ?? $this->items->count();

        if ($total === 0) {
            return 0;
        }

        $completed = $this->completed_items_count ?? $this->items->where('is_completed', true)->count();

        return (int) round(($completed / $total) * 100);
    }
}
