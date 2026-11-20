<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\TwoFactorService;
use App\Services\WorkspaceService;
use App\Support\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());
        AuditLog::registered($user->id);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken('frontend')->plainTextToken,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            AuditLog::authFailed($request->validated('email'));

            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        $twoFactor = app(TwoFactorService::class);

        if ($twoFactor->isEnabled($user)) {
            $code = $request->validated('code');

            if ($code === null || $code === '') {
                // La contrasena fue correcta: el cliente debe reenviar las credenciales con el codigo.
                return response()->json([
                    'message' => 'Introduce el código de verificación de tu aplicación de autenticación.',
                    'two_factor_required' => true,
                ], 422);
            }

            if (! $twoFactor->attempt($user, $code)) {
                AuditLog::authFailed($request->validated('email'));

                throw ValidationException::withMessages([
                    'code' => ['El código de verificación no es correcto.'],
                ]);
            }
        }

        // Sesion unica: emitir un token nuevo invalida los anteriores.
        $user->tokens()->delete();
        AuditLog::authSucceeded('login', $user->id);
        app(WorkspaceService::class)->ensureCurrentWorkspace($user);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken('frontend')->plainTextToken,
        ]);
    }

    public function logout(): JsonResponse
    {
        $user = request()->user();
        $user->currentAccessToken()?->delete();
        AuditLog::authSucceeded('logout', $user->id);

        return response()->json(['message' => 'Sesion cerrada correctamente.']);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->validated());

        return response()->json([
            'message' => 'Si el email existe, enviaremos un enlace para restablecer el password.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->validated(),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['El enlace de recuperacion no es valido o ha caducado.'],
            ]);
        }

        return response()->json(['message' => 'Password actualizado correctamente.']);
    }

    public function user(): UserResource
    {
        $user = request()->user();

        // Repara el workspace actual si la membership se perdio (Issue #5).
        app(WorkspaceService::class)->ensureCurrentWorkspace($user);

        return new UserResource($user->refresh());
    }
}
