<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'name', 'city', 'country', 'latitude', 'longitude', 'type', 'best_time', 'access_difficulty', 'notes', 'tags', 'recommended_gear', 'cover_photo_id'])]
class Location extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'tags' => 'array',
            'recommended_gear' => 'array',
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
                ->orWhere('city', 'like', "%{$search}%")
                ->orWhere('country', 'like', "%{$search}%")
                ->orWhere('notes', 'like', "%{$search}%");
        }));
    }

    public function scopeCity($query, ?string $city)
    {
        return $query->when($city, fn ($builder) => $builder->where('city', 'like', "%{$city}%"));
    }

    public function scopeType($query, ?string $type)
    {
        return $query->when($type, fn ($builder) => $builder->where('type', $type));
    }

    public function scopeDifficulty($query, ?string $difficulty)
    {
        return $query->when($difficulty, fn ($builder) => $builder->where('access_difficulty', $difficulty));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coverPhoto(): BelongsTo
    {
        return $this->belongsTo(Photo::class, 'cover_photo_id');
    }
}
