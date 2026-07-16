<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'category', 'brand', 'model', 'weight_grams', 'condition', 'purchase_date', 'purchase_price', 'notes', 'is_favorite'])]
class GearItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_favorite' => 'boolean',
            'purchase_date' => 'date',
            'purchase_price' => 'decimal:2',
        ];
    }

    public function scopeOwnedBy($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($builder) => $builder->where(function ($inner) use ($search): void {
            $inner->where('name', 'like', "%{$search}%")
                ->orWhere('brand', 'like', "%{$search}%")
                ->orWhere('model', 'like', "%{$search}%");
        }));
    }

    public function scopeCategory($query, ?string $category)
    {
        return $query->when($category, fn ($builder) => $builder->where('category', $category));
    }

    public function scopeFavorites($query, mixed $favorites)
    {
        return $query->when($favorites !== null && $favorites !== '', fn ($builder) => $builder->where('is_favorite', filter_var($favorites, FILTER_VALIDATE_BOOLEAN)));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function presets(): HasMany
    {
        return $this->hasMany(Preset::class);
    }
}
