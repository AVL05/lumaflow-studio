<?php

namespace App\Http\Requests;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\Reminder;
use App\Models\Session;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ReminderRequest extends FormRequest
{
    /** Modelos a los que se puede asociar un recordatorio. */
    private const MORPHS = [
        'session' => Session::class,
        'client' => Client::class,
        'delivery' => Delivery::class,
        'task' => Task::class,
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'remind_date' => ['required', 'date'],
            'remind_time' => ['nullable', 'date_format:H:i'],
            'message' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(Reminder::TYPES)],
            'status' => ['sometimes', Rule::in(Reminder::STATUSES)],
            'remindable_type' => ['nullable', Rule::in(array_keys(self::MORPHS))],
            'remindable_id' => ['nullable', 'integer', 'required_with:remindable_type'],
        ];
    }

    /** Valida que el modelo asociado pertenezca al usuario autenticado. */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $type = $this->input('remindable_type');
                $id = $this->input('remindable_id');

                if (! $type || ! $id) {
                    return;
                }

                $exists = self::MORPHS[$type]::query()->ownedBy($this->user()->id)->whereKey($id)->exists();

                if (! $exists) {
                    $validator->errors()->add('remindable_id', 'El elemento asociado no existe.');
                }
            },
        ];
    }

    public function morphClass(): ?string
    {
        return self::MORPHS[$this->input('remindable_type')] ?? null;
    }
}
