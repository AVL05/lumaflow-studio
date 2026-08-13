<?php

namespace App\Http\Requests;

use App\Models\Job;
use App\Services\JobWorkflowService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class JobRequest extends FormRequest
{
    public function authorize(): bool
    {
        $job = $this->route('job');
        abort_if($job && $job->user_id !== $this->user()->id, 404);

        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['nullable', Rule::exists('clients', 'id')->where('user_id', $this->user()->id)],
            'location_id' => ['nullable', Rule::exists('locations', 'id')->where('user_id', $this->user()->id)],
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
            'gear_item_ids.*' => [Rule::exists('gear_items', 'id')->where('user_id', $this->user()->id)],
            'create_workflow_tasks' => ['sometimes', 'boolean'],
        ];
    }
}
