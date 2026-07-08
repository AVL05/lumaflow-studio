<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'before_photo_id', 'after_photo_id', 'title', 'notes'])]
class PhotoComparison extends Model
{
    use HasFactory;

    public function beforePhoto(): BelongsTo
    {
        return $this->belongsTo(Photo::class, 'before_photo_id');
    }

    public function afterPhoto(): BelongsTo
    {
        return $this->belongsTo(Photo::class, 'after_photo_id');
    }
}
