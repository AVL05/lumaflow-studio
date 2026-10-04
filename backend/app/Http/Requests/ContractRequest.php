<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $workspaces = $this->user()->workspaceIds();

        return [
            // Solo Markdown controlado: nunca HTML arbitrario.
            'job_id' => ['required', Rule::exists('photography_jobs', 'id')->whereIn('workspace_id', $workspaces)],
            'client_id' => ['required', Rule::exists('clients', 'id')->whereIn('workspace_id', $workspaces)],
            'quote_id' => ['nullable', Rule::exists('quotes', 'id')->whereIn('workspace_id', $workspaces)],
            'title' => ['required', 'string', 'max:180'],
            'content' => ['nullable', 'string', 'max:20000', 'not_regex:/<\s*(script|iframe|object|embed|form|input|button|a\s|img\s)/i'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
