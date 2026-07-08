<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AiChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // El historial no se acepta del cliente: se reconstruye desde la
        // conversacion persistida para que no se pueda inyectar contexto falso.
        return [
            'message' => ['required', 'string', 'max:3000'],
            'conversation_id' => ['nullable', 'integer'],
        ];
    }
}
