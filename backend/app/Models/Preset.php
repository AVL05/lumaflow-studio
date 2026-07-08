<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'name', 'description', 'category', 'style', 'contrast', 'shadows', 'highlights', 'whites', 'blacks', 'clarity', 'texture', 'intensity', 'saturation', 'vibrance', 'temperature', 'tint', 'sharpness', 'noise_reduction', 'grain', 'vignette', 'recommended_use', 'is_favorite', 'color', 'version', 'usage_count'])]
class Preset extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_favorite' => 'boolean',
            'usage_count' => 'integer',
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
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('recommended_use', 'like', "%{$search}%");
        }));
    }

    public function scopeCategory($query, ?string $category)
    {
        return $query->when($category, fn ($builder) => $builder->where('category', $category));
    }

    public function scopeStyle($query, ?string $style)
    {
        return $query->when($style, fn ($builder) => $builder->where('style', $style));
    }

    public function scopeFavorites($query, mixed $favorites)
    {
        return $query->when($favorites !== null && $favorites !== '', fn ($builder) => $builder->where('is_favorite', filter_var($favorites, FILTER_VALIDATE_BOOLEAN)));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
