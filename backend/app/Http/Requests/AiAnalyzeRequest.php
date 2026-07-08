<?php

namespace App\Http\Requests;

use App\Models\Photo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AiAnalyzeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo_id' => [
                'required',
                Rule::exists(Photo::class, 'id')->where('user_id', $this->user()->id),
            ],
            'prompt' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
