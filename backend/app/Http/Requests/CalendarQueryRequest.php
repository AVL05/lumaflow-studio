<?php

namespace App\Http\Requests;

use App\Services\CalendarService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CalendarQueryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'sources' => ['sometimes', 'array'],
            'sources.*' => [Rule::in(CalendarService::SOURCES)],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('sources'))) {
            $this->merge(['sources' => array_filter(explode(',', $this->input('sources')))]);
        }
    }
}
