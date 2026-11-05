<?php

namespace App\Http\Requests;

use App\Models\Checklist;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChecklistRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($job = $this->route('job')) {
            app(WorkspaceAuthorizer::class)->requireAccessOr404($this->user(), $job);
            $this->merge(['job_id' => $job->id]);
        }

        return true;
    }

    public function rules(): array
    {
        $workspaceId = app(WorkspaceAuthorizer::class)->workspaceForRequest($this);

        return [
            'job_id' => ['nullable', Rule::exists('photography_jobs', 'id')->where('workspace_id', $workspaceId)],
            'stage_id' => ['nullable', Rule::exists('postproduction_stages', 'id')->where('workspace_id', $workspaceId)->where('job_id', $this->input('job_id', $this->route('checklist')?->job_id))],
            'session_id' => ['nullable', Rule::exists('sessions', 'id')->where('workspace_id', $workspaceId)->when($this->input('stage_id', $this->route('checklist')?->stage_id), fn ($q) => $q->where('job_id', $this->input('job_id', $this->route('checklist')?->job_id)))],
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::in(Checklist::TYPES)],
            'use_template' => ['sometimes', 'boolean'],
            'items' => ['sometimes', 'array', 'max:60'],
            'items.*' => ['required', 'string', 'max:180'],
        ];
    }
}
