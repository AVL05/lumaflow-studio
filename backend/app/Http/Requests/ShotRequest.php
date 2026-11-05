<?php

namespace App\Http\Requests;

use App\Models\Shot;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ShotRequest extends FormRequest
{
    public function authorize(): bool
    {
        $job = $this->route('job');
        app(WorkspaceAuthorizer::class)->requireAccessOr404($this->user(), $job);
        if ($shot = $this->route('shot')) {
            abort_unless($shot->job_id === $job->id, 404);
        }

        return true;
    }

    public function rules(): array
    {
        $job = $this->route('job');
        if ($this->routeIs('shots.move')) {
            return ['direction' => ['required', Rule::in(['up', 'down'])]];
        }
        $rules = [
            'description' => [$this->isMethod('post') ? 'required' : 'sometimes', 'required', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(Shot::STATUSES)],
            'revision' => [$this->isMethod('patch') ? 'required' : 'sometimes', 'integer', 'min:0', 'max:2147483646'],
            'session_id' => ['nullable', 'integer', Rule::exists('sessions', 'id')->where('workspace_id', $job->workspace_id)->where('job_id', $job->id)],
            'location_id' => ['nullable', 'integer', Rule::exists('locations', 'id')->where('workspace_id', $job->workspace_id)],
            'gear_item_ids' => ['sometimes', 'array', 'list', 'max:50'],
            'gear_item_ids.*' => ['integer', 'distinct', Rule::exists('gear_items', 'id')->where('workspace_id', $job->workspace_id)],
            'estimated_seconds' => ['nullable', 'integer', 'min:1', 'max:86400'],
            'scheduled_time' => ['nullable', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:4000'],
        ];
        foreach (['scene', 'shot_type', 'camera_movement', 'focal_length'] as $field) {
            $rules[$field] = ['nullable', 'string', 'max:120'];
        }

        return $rules;
    }
}
