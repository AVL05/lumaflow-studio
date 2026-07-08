<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PresetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:3000'],
            'category' => ['required', Rule::in(['color', 'black_white', 'portrait', 'outdoor', 'indoor', 'product', 'social', 'client', 'experimental'])],
            'style' => ['required', Rule::in(['cinematic', 'moody', 'urban', 'street', 'portrait', 'wedding', 'landscape', 'nature', 'automotive', 'product', 'editorial', 'documentary', 'travel', 'black_white', 'warm', 'cold', 'minimal', 'film', 'vintage', 'custom'])],
            'contrast' => ['required', 'integer', 'between:-100,100'],
            'shadows' => ['required', 'integer', 'between:-100,100'],
            'highlights' => ['required', 'integer', 'between:-100,100'],
            'whites' => ['required', 'integer', 'between:-100,100'],
            'blacks' => ['required', 'integer', 'between:-100,100'],
            'clarity' => ['required', 'integer', 'between:-100,100'],
            'texture' => ['required', 'integer', 'between:-100,100'],
            'intensity' => ['required', 'integer', 'between:0,100'],
            'saturation' => ['required', 'integer', 'between:-100,100'],
            'vibrance' => ['required', 'integer', 'between:-100,100'],
            'temperature' => ['required', 'integer', 'between:-100,100'],
            'tint' => ['required', 'integer', 'between:-100,100'],
            'sharpness' => ['required', 'integer', 'between:0,100'],
            'noise_reduction' => ['required', 'integer', 'between:0,100'],
            'grain' => ['required', 'integer', 'between:0,100'],
            'vignette' => ['required', 'integer', 'between:-100,100'],
            'recommended_use' => ['nullable', 'string', 'max:2000'],
            'is_favorite' => ['sometimes', 'boolean'],
            'color' => ['required', 'string', 'max:20'],
            'version' => ['required', 'string', 'max:20'],
        ];
    }
}
