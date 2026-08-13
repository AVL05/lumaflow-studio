<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClientImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'clients' => ['required', 'array', 'min:1', 'max:250'],
            'clients.*.name' => ['required', 'string', 'max:160'],
            'clients.*.email' => ['nullable', 'email', 'max:160'],
            'clients.*.phone' => ['nullable', 'string', 'max:80'],
            'clients.*.company' => ['nullable', 'string', 'max:160'],
            'clients.*.notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
