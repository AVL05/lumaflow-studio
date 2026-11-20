<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccountDeletionService;
use App\Support\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AccountDeletionController extends Controller
{
    public function __construct(private readonly AccountDeletionService $deletion) {}

    /** Programa el borrado de la cuenta tras el periodo de gracia. Exige la contrasena. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();

        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => ['La contraseña no es correcta.']]);
        }

        $blockers = $this->deletion->blockers($user);

        if ($blockers->isNotEmpty()) {
            return response()->json([
                'message' => 'Tu estudio tiene otros miembros. Retíralos en Configuración antes de eliminar la cuenta.',
                'workspaces' => $blockers->pluck('name')->all(),
            ], 409);
        }

        $this->deletion->request($user);
        AuditLog::authSucceeded('account_deletion_requested', $user->id);

        return response()->json([
            'message' => 'Cuenta programada para eliminarse. Puedes cancelarlo hasta esa fecha.',
            'deletion_scheduled_for' => $user->deletion_scheduled_for?->toISOString(),
            'grace_days' => AccountDeletionService::graceDays(),
        ], 202);
    }

    /** Cancela un borrado programado. */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->deletion->cancel($user);
        AuditLog::authSucceeded('account_deletion_cancelled', $user->id);

        return response()->json(['message' => 'Borrado de cuenta cancelado.']);
    }
}
