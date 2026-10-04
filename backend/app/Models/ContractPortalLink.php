<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['contract_id', 'token_hash', 'expires_at', 'revoked_at', 'last_used_at'])]
class ContractPortalLink extends Model
{
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'last_used_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function scopeActive($query)
    {
        return $query->whereNull('revoked_at');
    }

    public function isUsable(): bool
    {
        return $this->getAttribute('revoked_at') === null
            && ($this->getAttribute('expires_at') === null || $this->expires_at->isFuture());
    }
}
