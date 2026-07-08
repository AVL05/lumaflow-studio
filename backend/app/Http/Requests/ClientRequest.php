<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'max:160'],
            'phone' => ['nullable', 'string', 'max:80'],
            'company' => ['nullable', 'string', 'max:160'],
            'instagram' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'status' => ['required', Rule::in(['active', 'inactive', 'lead', 'archived'])],
        ];
    }
}
