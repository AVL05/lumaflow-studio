<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivityLogger
{
    public const CREATED = 'created';

    public const UPDATED = 'updated';

    public const DELETED = 'deleted';

    public const STATUS_CHANGED = 'status_changed';

    public const PHOTO_UPLOADED = 'photo_uploaded';

    public const AI_ANALYSIS = 'ai_analysis';

    public const AI_PLAN = 'ai_plan';

    public const DELIVERED = 'delivered';

    public const COMMENT = 'comment';

    public const CHECKLIST_COMPLETED = 'checklist_completed';

    public function log(User $user, Model $subject, string $type, ?string $description = null, array $properties = []): Activity
    {
        return Activity::create([
            'user_id' => $user->id,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'type' => $type,
            'description' => $description,
            'properties' => $properties ?: null,
        ]);
    }

    /**
     * Registra el cambio de estado solo si realmente cambio.
     */
    public function logStatusChange(User $user, Model $subject, ?string $from, ?string $to): ?Activity
    {
        if ($from === $to) {
            return null;
        }

        return $this->log(
            $user,
            $subject,
            self::STATUS_CHANGED,
            "Estado {$from} -> {$to}",
            ['from' => $from, 'to' => $to],
        );
    }
}
