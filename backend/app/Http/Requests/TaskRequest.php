<?php

namespace App\Http\Requests;

use App\Models\Task;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaskRequest extends FormRequest
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
            'stage_id' => ['nullable', Rule::exists('postproduction_stages', 'id')->where('workspace_id', $workspaceId)->where('job_id', $this->input('job_id', $this->route('task')?->job_id))],
            'assigned_user_id' => ['nullable', Rule::exists('workspace_memberships', 'user_id')->where('workspace_id', $workspaceId)],
            'workflow_phase' => ['nullable', Rule::in(['preparation', 'production', 'postproduction', 'delivery'])],
            'revision' => ['sometimes', 'integer', 'min:0', 'max:2147483646'],
            'job_id' => ['nullable', Rule::exists('photography_jobs', 'id')->where('workspace_id', $workspaceId)],
            'session_id' => ['nullable', Rule::exists('sessions', 'id')->where('workspace_id', $workspaceId)->when($this->input('stage_id', $this->route('task')?->stage_id), fn ($q) => $q->where('job_id', $this->input('job_id', $this->route('task')?->job_id)))],
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('workspace_id', $workspaceId)],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:3000'],
            'priority' => ['required', Rule::in(Task::PRIORITIES)],
            'status' => ['required', Rule::in(Task::STATUSES)],
            'due_date' => ['nullable', 'date'],
            'due_time' => ['nullable', 'date_format:H:i'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
