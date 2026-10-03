<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_id' => ['nullable', Rule::exists('photography_jobs', 'id')->whereIn('workspace_id', $this->user()->workspaceIds())],
            'session_id' => ['nullable', Rule::exists('sessions', 'id')->whereIn('workspace_id', $this->user()->workspaceIds())],
            'client_id' => ['nullable', Rule::exists('clients', 'id')->whereIn('workspace_id', $this->user()->workspaceIds())],
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
