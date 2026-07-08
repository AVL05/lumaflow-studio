<?php

namespace App\Http\Requests;

use App\Models\Session;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PhotoUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_id' => [
                'nullable',
                Rule::exists(Session::class, 'id')->where('user_id', $this->user()->id),
            ],
            'title' => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:3000'],
            'category' => ['nullable', 'string', 'max:80'],
            'taken_at' => ['nullable', 'date'],
            'is_favorite' => ['sometimes', 'boolean'],
            'album_ids' => ['nullable', 'array'],
            'album_ids.*' => ['integer', Rule::exists('albums', 'id')->where('user_id', $this->user()->id)],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', Rule::exists('tags', 'id')->where('user_id', $this->user()->id)],
        ];
    }
}
