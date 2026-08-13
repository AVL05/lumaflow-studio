<?php

namespace App\Services;

use App\Models\Job;

class JobTransitionService
{
    private const ORDER = ['lead', 'quoted', 'contract_pending', 'confirmed', 'preparation', 'shoot', 'editing', 'review', 'delivered', 'closed'];

    public function __construct(private readonly ActivityLogger $activity) {}

    public function advance(?Job $job, string $status, string $reason): void
    {
        if (! $job || $job->status === 'cancelled' || ! in_array($status, Job::STATUSES, true)) {
            return;
        }
        $current = array_search($job->status, self::ORDER, true);
        $target = array_search($status, self::ORDER, true);
        if ($target === false || ($current !== false && $target <= $current)) {
            return;
        }
        $previous = $job->status;
        $job->update(['status' => $status]);
        $this->activity->logStatusChange($job->user, $job, $previous, $status);
        $this->activity->log($job->user, $job, ActivityLogger::UPDATED, $reason);
    }
}
