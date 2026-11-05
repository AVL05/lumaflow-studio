<?php

namespace App\Http\Requests;

use App\Models\PostproductionStage;
use App\Services\JobWorkflowService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        $job = $this->route('job');
        app(WorkspaceAuthorizer::class)->requireAccessOr404($this->user(), $job);
        if ($this->isMethod('put') && $this->route('key')) {
            abort_unless(preg_match('/^custom-\d+$/', $this->route('key')), 404);
            app(JobWorkflowService::class)->template($job, $this->route('key'));
        }
        if ($stage = $this->route('stage')) {
            abort_unless($stage->job_id === $job->id, 404);
        }

        return true;
    }

    public function rules(): array
    {
        $revision = ['required', 'integer', 'min:0', 'max:2147483646'];
        if ($this->routeIs('workflow.apply')) {
            return ['confirmed' => ['required', 'accepted'], 'preview_hash' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/']];
        }
        if ($this->routeIs('workflow.initialize')) {
            return ['confirmed' => ['required', 'accepted']];
        }
        if ($this->routeIs('workflow.stage.move')) {
            return ['revision' => $revision, 'direction' => ['required', Rule::in(['up', 'down'])]];
        }
        if ($this->routeIs('workflow.stage.create', 'workflow.stage.update')) {
            return [
                'label' => [$this->isMethod('post') ? 'required' : 'sometimes', 'string', 'max:120'],
                'revision' => $this->isMethod('post') ? ['prohibited'] : $revision,
                'status' => ['sometimes', Rule::in(PostproductionStage::STATUSES)],
                'assigned_user_id' => ['nullable', Rule::exists('workspace_memberships', 'user_id')->where('workspace_id', $this->route('job')->workspace_id)],
                'due_date' => ['nullable', 'date_format:Y-m-d'], 'notes' => ['nullable', 'string', 'max:4000'],
            ];
        }
        $rules = [
            'name' => ['required', 'string', 'max:120'], 'description' => ['nullable', 'string', 'max:1000'],
            'revision' => $this->isMethod('put') ? $revision : ['prohibited'],
            'definition' => ['required', 'array:tasks,checklists,stages'],
            'definition.tasks' => ['present', 'array', 'list', 'max:24'],
            'definition.tasks.*' => ['array:title,phase'], 'definition.tasks.*.title' => ['required', 'string', 'max:180'],
            'definition.tasks.*.phase' => ['required', Rule::in(['preparation', 'production', 'postproduction', 'delivery'])],
            'definition.stages' => ['present', 'array', 'list', 'max:16'],
            'definition.stages.*' => ['array:key,label,tasks,checklists'],
            'definition.stages.*.key' => ['required', 'string', 'regex:/^[a-z][a-z0-9_-]{0,59}$/', 'distinct'],
            'definition.stages.*.label' => ['required', 'string', 'max:120'],
            'definition.stages.*.tasks' => ['present', 'array', 'list', 'max:16'],
            'definition.stages.*.tasks.*' => ['required', 'string', 'max:180'],
        ];
        foreach (['definition.checklists', 'definition.stages.*.checklists'] as $path) {
            $rules[$path] = ['present', 'array', 'list', 'max:4'];
            $rules[$path.'.*'] = ['array:name,items'];
            $rules[$path.'.*.name'] = ['required', 'string', 'max:120'];
            $rules[$path.'.*.items'] = ['present', 'array', 'list', 'max:20'];
            $rules[$path.'.*.items.*'] = ['required', 'string', 'max:180'];
        }

        return $rules;
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->any() || ! $this->has('definition')) {
                return;
            }
            $definition = $this->input('definition');
            $count = count($definition['tasks']) + count($definition['stages']);
            $checklists = $definition['checklists'];
            foreach ($definition['stages'] as $stage) {
                $count += count($stage['tasks']);
                $checklists = array_merge($checklists, $stage['checklists']);
            }
            foreach ($checklists as $checklist) {
                $count += 1 + count($checklist['items']);
            }
            if ($count > 300) {
                $validator->errors()->add('definition', 'La plantilla supera los 300 elementos. Divídela en varias plantillas.');
            }
        });
    }
}
