<?php

namespace App\Http\Requests;

use App\Models\Checklist;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChecklistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_id' => ['nullable', Rule::exists('sessions', 'id')->whereIn('workspace_id', $this->user()->workspaceIds())],
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::in(Checklist::TYPES)],
            'use_template' => ['sometimes', 'boolean'],
            'items' => ['sometimes', 'array', 'max:60'],
            'items.*' => ['required', 'string', 'max:180'],
        ];
    }
}
