<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AiPresetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'style' => ['required', 'string', 'max:80'],
            'photo_type' => ['required', 'string', 'max:120'],
            'time_of_day' => ['nullable', 'string', 'max:120'],
            'weather' => ['nullable', 'string', 'max:120'],
            'location' => ['nullable', 'string', 'max:160'],
            'gear' => ['nullable', 'string', 'max:200'],
        ];
    }
}
