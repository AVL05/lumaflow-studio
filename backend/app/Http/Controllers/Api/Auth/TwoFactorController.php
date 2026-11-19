<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorService;
use App\Support\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TwoFactorController extends Controller
{
    public function __construct(private readonly TwoFactorService $twoFactor) {}

    /** Genera un secreto pendiente de confirmar. No activa nada hasta `confirm`. */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($this->twoFactor->isEnabled($user)) {
            throw ValidationException::withMessages(['code' => ['El segundo factor ya está activado.']]);
        }

        $secret = $this->twoFactor->generateSecret();
        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_last_slice' => null,
        ])->save();

        return response()->json([
            'secret' => $secret,
            'otpauth_uri' => $this->twoFactor->otpauthUri($user, $secret),
        ]);
    }

    /** Confirma con un codigo valido, activa el 2FA y devuelve los codigos de recuperacion (una sola vez). */
    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:32']]);
        $user = $request->user();

        if ($user->two_factor_secret === null || $this->twoFactor->isEnabled($user)) {
            throw ValidationException::withMessages(['code' => ['Inicia la configuración del segundo factor primero.']]);
        }

        $slice = $this->twoFactor->verifyCode((string) $user->two_factor_secret, $data['code']);

        if ($slice === null) {
            throw ValidationException::withMessages(['code' => ['El código de verificación no es correcto.']]);
        }

        $user->forceFill(['two_factor_confirmed_at' => now(), 'two_factor_last_slice' => $slice])->save();
        $codes = $this->twoFactor->generateRecoveryCodes($user);
        AuditLog::authSucceeded('two_factor_enabled', $user->id);

        return response()->json(['recovery_codes' => $codes]);
    }

    /** Desactiva el 2FA: exige la contrasena y un codigo (TOTP o recuperacion). */
    public function disable(Request $request): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string'],
            'code' => ['required', 'string', 'max:32'],
        ]);
        $user = $request->user();

        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => ['La contraseña no es correcta.']]);
        }

        if (! $this->twoFactor->attempt($user, $data['code'])) {
            throw ValidationException::withMessages(['code' => ['El código de verificación no es correcto.']]);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_last_slice' => null,
        ])->save();
        AuditLog::authSucceeded('two_factor_disabled', $user->id);

        return response()->json(['message' => 'Segundo factor desactivado.']);
    }
}
