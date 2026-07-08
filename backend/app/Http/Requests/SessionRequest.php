<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'date' => ['required', 'date'],
            'time' => ['nullable', 'date_format:H:i'],
            'location_name' => ['nullable', 'string', 'max:160'],
            'session_type' => ['required', Rule::in(['portrait', 'wedding', 'product', 'urban', 'landscape', 'event', 'automotive', 'nature', 'other'])],
            'status' => ['required', Rule::in(['planned', 'confirmed', 'completed', 'editing', 'delivered', 'cancelled'])],
            'description' => ['nullable', 'string', 'max:3000'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'client_name' => ['nullable', 'string', 'max:160'],
        ];
    }
}
