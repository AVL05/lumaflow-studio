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
            'gear_item_id' => ['nullable', Rule::exists('gear_items', 'id')->where('user_id', $this->user()->id)],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:80'],
            'iso' => ['nullable', 'string', 'max:20'],
            'aperture' => ['nullable', 'string', 'max:20'],
            'shutter_speed' => ['nullable', 'string', 'max:20'],
            'white_balance' => ['nullable', 'string', 'max:50'],
            'exposure_compensation' => ['nullable', 'numeric', 'between:-10,10'],
            'notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
