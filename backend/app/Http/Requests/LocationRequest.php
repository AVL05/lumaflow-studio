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
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'is_favorite' => ['boolean'],
            'access_mode' => ['nullable', Rule::in(['car', 'walking', 'public_transport', 'mixed'])],
            'permissions_required' => ['nullable', 'string', 'max:1000'],
            'cost' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'google_maps_url' => ['nullable', 'url', 'max:255'],
            'apple_maps_url' => ['nullable', 'url', 'max:255'],
            'openstreetmap_url' => ['nullable', 'url', 'max:255'],
            'recommended_weather' => ['nullable', 'string', 'max:160'],
            'recommended_seasons' => ['nullable', 'array'],
            'recommended_seasons.*' => ['string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'recommended_gear' => ['nullable', 'array'],
            'recommended_gear.*' => ['string', 'max:80'],
            'cover_photo_id' => ['nullable', Rule::exists('photos', 'id')->where('user_id', $this->user()->id)],
            'photo_ids' => ['nullable', 'array'],
            'photo_ids.*' => [Rule::exists('photos', 'id')->where('user_id', $this->user()->id)],
        ];
    }

    public function locationAttributes(): array
    {
        return collect($this->validated())->except('photo_ids')->all();
    }

    public function photoIds(): array
    {
        return collect($this->validated('photo_ids', []))->unique()->values()->all();
    }
}
