<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AiGearRecommendationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_type' => ['required', 'string', 'max:120'],
            'location' => ['nullable', 'string', 'max:160'],
            'weather' => ['nullable', 'string', 'max:120'],
            'time' => ['nullable', 'string', 'max:80'],
        ];
    }
}
