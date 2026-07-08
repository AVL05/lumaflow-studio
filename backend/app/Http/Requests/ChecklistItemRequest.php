<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChecklistItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'is_completed' => ['sometimes', 'boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
