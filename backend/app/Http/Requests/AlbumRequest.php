<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AlbumRequest extends FormRequest
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
            'color' => ['required', 'string', 'max:20'],
            'cover_photo_id' => ['nullable', Rule::exists('photos', 'id')->where('user_id', $this->user()->id)],
            'date' => ['nullable', 'date'],
            'photo_ids' => ['nullable', 'array'],
            'photo_ids.*' => ['integer', Rule::exists('photos', 'id')->where('user_id', $this->user()->id)],
        ];
    }
}
