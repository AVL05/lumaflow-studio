<?php

namespace App\Http\Requests;

use App\Services\CalendarService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CalendarMoveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'source' => ['required', Rule::in(CalendarService::SOURCES)],
            'source_id' => ['required', 'integer', 'min:1'],
            'date' => ['required', 'date'],
            'time' => ['nullable', 'date_format:H:i'],
        ];
    }
}
