<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            // Segundo factor (TOTP o codigo de recuperacion) para cuentas con 2FA activado.
            'code' => ['nullable', 'string', 'max:32'],
        ];
    }
}
