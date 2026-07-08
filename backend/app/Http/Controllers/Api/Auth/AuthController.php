<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
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

        // Sesion unica: emitir un token nuevo invalida los anteriores.
        $user->tokens()->delete();
        AuditLog::authSucceeded('login', $user->id);

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

    public function user(): UserResource
    {
        return new UserResource(request()->user());
    }
}
