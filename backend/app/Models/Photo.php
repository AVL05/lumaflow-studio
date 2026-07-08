<?php

namespace App\Models;

use App\Models\Concerns\CleansUpWorkflowRelations;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'session_id', 'title', 'description', 'file_path', 'thumbnail_path', 'file_name', 'file_size', 'mime_type', 'taken_at', 'category', 'is_favorite', 'tags', 'exif'])]
class Photo extends Model
{
    use CleansUpWorkflowRelations, HasFactory;

    protected function casts(): array
    {
        return [
            'is_favorite' => 'boolean',
            'tags' => 'array',
            'exif' => 'array',
            'taken_at' => 'date',
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
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('file_name', 'like', "%{$search}%")
                ->orWhere('category', 'like', "%{$search}%")
                ->orWhereHas('session', fn ($session) => $session->where('name', 'like', "%{$search}%"))
                ->orWhereHas('albums', fn ($albums) => $albums->where('name', 'like', "%{$search}%"))
                ->orWhereHas('tags', fn ($tags) => $tags->where('name', 'like', "%{$search}%"));
        }));
    }

    public function scopeCategory($query, ?string $category)
    {
        return $query->when($category, fn ($builder) => $builder->where('category', $category));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function albums(): BelongsToMany
    {
        return $this->belongsToMany(Album::class)->withTimestamps();
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
    }

    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class)->withTimestamps();
    }

    public function aiAnalyses(): HasMany
    {
        return $this->hasMany(AiAnalysis::class);
    }
}
