<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'city', 'country', 'latitude', 'longitude', 'type', 'best_time', 'access_difficulty', 'rating', 'is_favorite', 'access_mode', 'permissions_required', 'cost', 'google_maps_url', 'apple_maps_url', 'openstreetmap_url', 'recommended_weather', 'recommended_seasons', 'notes', 'tags', 'recommended_gear', 'cover_photo_id'])]
class Location extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'rating' => 'integer',
            'is_favorite' => 'boolean',
            'cost' => 'decimal:2',
            'tags' => 'array',
            'recommended_gear' => 'array',
            'recommended_seasons' => 'array',
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

    public function scopeFavorite($query, mixed $favorite)
    {
        return $query->when($favorite !== null && $favorite !== '', fn ($builder) => $builder->where('is_favorite', filter_var($favorite, FILTER_VALIDATE_BOOLEAN)));
    }

    public function scopeAccessMode($query, ?string $accessMode)
    {
        return $query->when($accessMode, fn ($builder) => $builder->where('access_mode', $accessMode));
    }

    public function scopeNear($query, ?float $latitude, ?float $longitude, ?float $radiusKm)
    {
        return $query->when($latitude !== null && $longitude !== null, function ($builder) use ($latitude, $longitude, $radiusKm): void {
            $builder->selectRaw('(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) as distance_km', [
                $latitude,
                $longitude,
                $latitude,
            ])->when($radiusKm, fn ($inner) => $inner->having('distance_km', '<=', $radiusKm));
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coverPhoto(): BelongsTo
    {
        return $this->belongsTo(Photo::class, 'cover_photo_id');
    }

    public function photos(): BelongsToMany
    {
        return $this->belongsToMany(Photo::class)->withTimestamps();
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }
}
