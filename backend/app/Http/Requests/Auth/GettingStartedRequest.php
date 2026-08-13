<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GettingStartedRequest extends FormRequest
{
    public const CHOICES = ['create_first_job', 'sample_workspace', 'import_clients'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'choice' => ['required', 'string', Rule::in(self::CHOICES)],
        ];
    }
}
