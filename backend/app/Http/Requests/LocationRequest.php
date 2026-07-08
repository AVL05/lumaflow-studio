<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'city' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:120'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'type' => ['required', Rule::in(['urban', 'nature', 'studio', 'beach', 'mountain', 'forest', 'interior', 'industrial', 'street', 'architecture', 'automotive', 'other'])],
            'best_time' => ['nullable', 'string', 'max:120'],
            'access_difficulty' => ['required', Rule::in(['easy', 'medium', 'hard'])],
            'notes' => ['nullable', 'string', 'max:3000'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'recommended_gear' => ['nullable', 'array'],
            'recommended_gear.*' => ['string', 'max:80'],
            'cover_photo_id' => ['nullable', Rule::exists('photos', 'id')->where('user_id', $this->user()->id)],
        ];
    }
}
