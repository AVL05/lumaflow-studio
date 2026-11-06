<?php

namespace App\Http\Requests;

use App\Services\WorkspaceAuthorizer;

class ProductionDayRequest extends SessionRequest
{
    public function authorize(): bool
    {
        $job = $this->route('job');
        app(WorkspaceAuthorizer::class)->requireAccessOr404($this->user(), $job);
        if ($session = $this->route('session')) {
            abort_unless($session->job_id === $job->id, 404);
        }

        return true;
    }

    public function rules(): array
    {
        return array_merge(parent::rules(), ['job_id' => ['prohibited']]);
    }
}
