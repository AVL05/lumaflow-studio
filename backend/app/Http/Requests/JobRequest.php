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
        return [
            'client_id' => ['nullable', Rule::exists('clients', 'id')->whereIn('workspace_id', $this->user()->workspaceIds())],
            'location_id' => ['nullable', Rule::exists('locations', 'id')->whereIn('workspace_id', $this->user()->workspaceIds())],
            'title' => ['required', 'string', 'max:180'],
            'specialty' => ['required', Rule::in(array_keys(JobWorkflowService::WORKFLOWS))],
            'workflow_key' => ['required', Rule::in(array_keys(JobWorkflowService::WORKFLOWS))],
            'status' => ['required', Rule::in(Job::STATUSES)],
            'event_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:5000'],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'contract_status' => ['required', Rule::in(Job::CONTRACT_STATUSES)],
            'contract_url' => ['nullable', 'url', 'max:255'],
            'gear_item_ids' => ['sometimes', 'array'],
            'gear_item_ids.*' => [Rule::exists('gear_items', 'id')->whereIn('workspace_id', $this->user()->workspaceIds())],
            'create_workflow_tasks' => ['sometimes', 'boolean'],
        ];
    }
}
