<?php

namespace App\Http\Requests;

use App\Services\ProjectBriefingService;
use App\Services\WorkspaceAuthorizer;
use Illuminate\Foundation\Http\FormRequest;

class ProjectBriefingRequest extends FormRequest
{
    public function authorize(): bool
    {
        app(WorkspaceAuthorizer::class)->requireAccessOr404($this->user(), $this->route('job'));

        return true;
    }

    public function rules(): array
    {
        $rules = ['briefing' => ['present', 'array:'.implode(',', ProjectBriefingService::FIELDS)], 'revision' => ['required', 'integer', 'min:0', 'max:2147483646']];
        foreach (ProjectBriefingService::FIELDS as $field) {
            $rules['briefing.'.$field] = ['nullable', 'string', 'max:4000'];
        }

        return $rules;
    }
}
