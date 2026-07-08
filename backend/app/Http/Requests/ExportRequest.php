<?php

namespace App\Http\Requests;

use App\Services\ExportService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resource' => ['required', Rule::in(ExportService::resources())],
            'format' => ['required', Rule::in(ExportService::FORMATS)],
            'ids' => ['sometimes', 'array', 'max:500'],
            'ids.*' => ['integer', 'min:1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'resource' => $this->route('resource'),
            'format' => $this->input('format', 'csv'),
        ]);
    }
}
