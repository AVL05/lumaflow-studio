<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class DeliveryChangesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:2000'],
        ];
    }
}
