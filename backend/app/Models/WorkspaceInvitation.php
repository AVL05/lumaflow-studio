<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['workspace_id', 'email', 'role', 'token_hash', 'expires_at', 'status', 'invited_by', 'accepted_by', 'accepted_at'])]
class WorkspaceInvitation extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_REVOKED = 'revoked';

    public const STATUS_EXPIRED = 'expired';

    public const STATUSES = [self::STATUS_PENDING, self::STATUS_ACCEPTED, self::STATUS_REVOKED, self::STATUS_EXPIRED];

    /** Invitaciones validas durante 7 dias. */
    public const TTL_DAYS = 7;

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'accepted_at' => 'datetime'];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function accepter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function isUsable(): bool
    {
        return $this->getAttribute('status') === self::STATUS_PENDING
            && $this->getAttribute('expires_at') !== null
            && $this->expires_at->isFuture();
    }
}
