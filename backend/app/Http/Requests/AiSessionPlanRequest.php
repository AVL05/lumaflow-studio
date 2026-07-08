<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AiSessionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_id' => ['required', 'integer', 'exists:sessions,id'],
            'goals' => ['nullable', 'string', 'max:1200'],
            'constraints' => ['nullable', 'string', 'max:1200'],
        ];
    }
}
