<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GearItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'category' => ['required', Rule::in(['camera', 'lens', 'filter', 'flash', 'light', 'tripod', 'gimbal', 'drone', 'gopro', 'mobile', 'accessory', 'battery', 'sd_card'])],
            'brand' => ['nullable', 'string', 'max:120'],
            'model' => ['nullable', 'string', 'max:120'],
            'weight_grams' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'condition' => ['required', Rule::in(['active', 'maintenance', 'retired'])],
            'purchase_date' => ['nullable', 'date'],
            'purchase_price' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_favorite' => ['sometimes', 'boolean'],
        ];
    }
}
