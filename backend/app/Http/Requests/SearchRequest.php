<?php

namespace App\Http\Requests;

use App\Services\SearchService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['required', 'string', 'min:2', 'max:120'],
            'groups' => ['sometimes', 'array'],
            'groups.*' => [Rule::in(SearchService::GROUPS)],
            'per_group' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('groups'))) {
            $this->merge(['groups' => array_filter(explode(',', $this->input('groups')))]);
        }
    }
}
