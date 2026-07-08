<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', Rule::exists('clients', 'id')->where('user_id', $this->user()->id)],
            'session_id' => ['nullable', Rule::exists('sessions', 'id')->where('user_id', $this->user()->id)],
            'title' => ['required', 'string', 'max:180'],
            'status' => ['required', Rule::in(['draft', 'pending', 'delivered', 'approved', 'archived'])],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'delivery_date' => ['nullable', 'date'],
            'gallery_url' => ['nullable', 'url', 'max:255'],
            'private_notes' => ['nullable', 'string', 'max:3000'],
        ];
    }
}
