<?php

namespace App\Models;

use Database\Factories\WorkspaceMembershipFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['workspace_id', 'user_id', 'role'])]
class WorkspaceMembership extends Model
{
    /** @use HasFactory<WorkspaceMembershipFactory> */
    use HasFactory;

    public const ROLE_OWNER = 'owner';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_MEMBER = 'member';

    public const ROLES = [self::ROLE_OWNER, self::ROLE_ADMIN, self::ROLE_MEMBER];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeInWorkspace($query, int $workspaceId)
    {
        return $query->where('workspace_id', $workspaceId);
    }

    public function scopeWithRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    public function isPrivileged(): bool
    {
        return in_array($this->getAttribute('role'), [self::ROLE_OWNER, self::ROLE_ADMIN], true);
    }
}
