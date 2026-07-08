<?php

namespace App\Http\Requests;

use App\Models\Photo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AiAssistantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'max:3000'],
            'photo_id' => [
                'nullable',
                Rule::exists(Photo::class, 'id')->where('user_id', $this->user()->id),
            ],
        ];
    }
}
