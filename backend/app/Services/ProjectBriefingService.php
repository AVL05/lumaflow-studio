<?php

namespace App\Services;

use App\Models\Job;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProjectBriefingService
{
    public const FIELDS = ['objectives', 'references', 'technical_requirements', 'scenes', 'locations', 'risks', 'notes', 'open_questions'];

    public function __construct(private readonly WorkspaceAuthorizer $authorizer, private readonly ActivityLogger $activity) {}

    public function save(User $actor, Job $job, array $briefing, int $revision): Job
    {
        $this->authorizer->requireAccessOr404($actor, $job);

        return DB::transaction(function () use ($actor, $job, $briefing, $revision): Job {
            $changed = Job::query()->whereKey($job->id)->where('workspace_id', $job->workspace_id)->where('briefing_revision', $revision)
                ->update(['briefing' => json_encode($briefing, JSON_UNESCAPED_UNICODE), 'briefing_revision' => DB::raw('briefing_revision + 1')]);
            abort_unless($changed, 409, 'El briefing ha cambiado. Conserva tu borrador y recarga la versión guardada.');
            $this->activity->log($actor, $job, 'briefing_updated', 'Briefing actualizado.');

            return $job->refresh();
        }, 3);
    }
}
