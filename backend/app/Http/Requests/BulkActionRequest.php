<?php

namespace App\Http\Requests;

use App\Services\BulkActionService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resource' => ['required', Rule::in(array_keys(BulkActionService::MATRIX))],
            'action' => ['required', Rule::in(BulkActionService::ACTIONS)],
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'min:1'],
            'value' => ['required_if:action,status', 'nullable', 'string', 'max:40'],
            'tag_ids' => ['required_if:action,tags', 'array'],
            'tag_ids.*' => ['integer', 'min:1'],
            'album_id' => ['required_if:action,album', 'nullable', 'integer', 'min:1'],
            'client_id' => ['required_if:action,client', 'nullable', 'integer', 'min:1'],
        ];
    }
}
