<?php

namespace App\Http\Requests;

use App\Services\WorkspaceAuthorizer;
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
        $workspaceId = app(WorkspaceAuthorizer::class)->workspaceForRequest($this);

        return [
            // Solo Markdown controlado: nunca HTML arbitrario.
            'job_id' => ['required', Rule::exists('photography_jobs', 'id')->where('workspace_id', $workspaceId)],
            'client_id' => ['required', Rule::exists('clients', 'id')->where('workspace_id', $workspaceId)],
            'quote_id' => ['nullable', Rule::exists('quotes', 'id')->where('workspace_id', $workspaceId)],
            'title' => ['required', 'string', 'max:180'],
            'content' => ['nullable', 'string', 'max:20000', 'not_regex:/<\s*(script|iframe|object|embed|form|input|button|a\s|img\s)/i'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
