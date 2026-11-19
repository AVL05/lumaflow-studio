<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['checklist_id', 'title', 'is_completed', 'completed_at', 'position'])]
class ChecklistItem extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::saved(function (ChecklistItem $item): void {
            if ($item->wasRecentlyCreated || $item->wasChanged()) {
                PostproductionStage::contentChanged($item->checklist?->stage_id, ! $item->is_completed);
            }
        });
        static::deleted(fn (ChecklistItem $item) => PostproductionStage::contentChanged($item->checklist?->stage_id, false));
    }

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function checklist(): BelongsTo
    {
        return $this->belongsTo(Checklist::class);
    }
}
