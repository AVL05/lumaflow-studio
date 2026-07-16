<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'gear_item_id', 'name', 'category', 'iso', 'aperture', 'shutter_speed', 'white_balance', 'exposure_compensation', 'notes'])]
class Preset extends Model
{
    protected function casts(): array
    {
        return ['exposure_compensation' => 'decimal:1'];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gearItem(): BelongsTo
    {
        return $this->belongsTo(GearItem::class);
    }
}
