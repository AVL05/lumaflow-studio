<?php

namespace App\Http\Requests;

use App\Models\Job;
use App\Services\JobWorkflowService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JobRequest extends FormRequest
{
    public function authorize(): bool
    {
        $job = $this->route('job');
        abort_if($job && ! app(WorkspaceAuthorizer::class)->canAccess($this->user(), $job), 404);

        return true;
    }

    public function rules(): array
    {
        $workspaceId = app(WorkspaceAuthorizer::class)->workspaceForRequest($this);

        return [
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('workspace_id', $workspaceId)],
            'location_id' => ['nullable', Rule::exists('locations', 'id')->where('workspace_id', $workspaceId)],
            'title' => ['required', 'string', 'max:180'],
            'specialty' => ['required', Rule::in(array_keys(JobWorkflowService::WORKFLOWS))],
            'workflow_key' => ['required', Rule::in(array_keys(JobWorkflowService::WORKFLOWS))],
            'status' => ['required', Rule::in(Job::STATUSES)],
            'event_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:5000'],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'contract_status' => ['required', Rule::in(Job::CONTRACT_STATUSES)],
            'contract_url' => ['nullable', 'url:http,https', 'not_regex:~^https?://[^/?#]*@~i', 'max:255'],
            'gear_item_ids' => ['sometimes', 'array'],
            'gear_item_ids.*' => [Rule::exists('gear_items', 'id')->where('workspace_id', $workspaceId)],
            'create_workflow_tasks' => ['sometimes', 'boolean'],
            'project_type' => ['sometimes', Rule::in(Job::PROJECT_TYPES)],
            'participants' => ['sometimes', 'array', 'list', 'max:25'],
            'participants.*' => ['array:name,role'],
            'participants.*.name' => ['required', 'string', 'max:120'],
            'participants.*.role' => ['nullable', 'string', 'max:120'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d'],
            'delivery_due_date' => ['nullable', 'date_format:Y-m-d'],
            'external_links' => ['sometimes', 'array', 'list', 'max:20'],
            'external_links.*' => ['array:label,url'],
            'external_links.*.label' => ['required', 'string', 'max:120'],
            'external_links.*.url' => ['required', 'url:http,https', 'not_regex:~^https?://[^/?#]*@~i', 'max:2048'],
            'location_ids' => ['sometimes', 'array', 'list', 'max:25'],
            'location_ids.*' => ['integer', 'distinct', Rule::exists('locations', 'id')->where('workspace_id', $workspaceId)],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->any()) {
                return;
            }
            $job = $this->route('job');
            $start = $this->input('start_date', $job?->start_date?->toDateString());
            $end = $this->input('end_date', $job?->end_date?->toDateString());
            if ($start && $end && $end < $start) {
                $validator->errors()->add('end_date', 'La fecha final no puede ser anterior al inicio.');
            }
        });
    }
}
