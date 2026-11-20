<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Borrado de cuenta con periodo de gracia (#67).
 *
 * Solicitar el borrado solo programa una fecha: la cuenta sigue funcionando y se puede cancelar.
 * La purga (comando `account:purge-deleted`, lanzado a diario por GitHub Actions) borra la cuenta
 * al vencer el plazo.
 *
 * Datos compartidos: casi todas las tablas de dominio guardan `user_id` (autor) con
 * `ON DELETE CASCADE` y `workspace_id` con `SET NULL`. Borrar a un miembro arrastraria los
 * registros que creo en el estudio de otra persona, asi que antes de borrar se reasignan al
 * propietario de ese estudio. Los estudios propios sin otros miembros se eliminan enteros.
 */
class AccountDeletionService
{
    /** Tablas de dominio con autor y estudio (se descubren por columnas, sin lista fija). */
    private const SKIP_TABLES = ['users', 'workspaces', 'workspace_memberships', 'workspace_invitations', 'personal_access_tokens'];

    public static function graceDays(): int
    {
        return max(1, (int) config('account.deletion_grace_days', 30));
    }

    /**
     * Estudios propios con otros miembros: hay que quitar a esas personas antes de borrar la cuenta
     * (no se les puede dejar sin estudio ni borrarles el trabajo).
     *
     * @return Collection<int, Workspace>
     */
    public function blockers(User $user): Collection
    {
        return Workspace::query()
            ->where('user_id', $user->id)
            ->whereIn('id', WorkspaceMembership::query()->where('user_id', '!=', $user->id)->select('workspace_id'))
            ->get(['id', 'name']);
    }

    public function request(User $user): User
    {
        $user->forceFill([
            'deletion_requested_at' => now(),
            'deletion_scheduled_for' => now()->addDays(self::graceDays()),
        ])->save();

        return $user;
    }

    public function cancel(User $user): User
    {
        $user->forceFill(['deletion_requested_at' => null, 'deletion_scheduled_for' => null])->save();

        return $user;
    }

    /** @return Collection<int, User> Cuentas cuyo plazo ha vencido. */
    public function due(): Collection
    {
        return User::query()
            ->whereNotNull('deletion_scheduled_for')
            ->where('deletion_scheduled_for', '<=', now())
            ->get();
    }

    /**
     * Borra la cuenta. Devuelve false (sin tocar nada) si un estudio propio ha vuelto a tener
     * miembros desde que se solicito el borrado.
     */
    public function purge(User $user): bool
    {
        if ($this->blockers($user)->isNotEmpty()) {
            return false;
        }

        DB::transaction(function () use ($user): void {
            $domainTables = $this->domainTables();
            $ownedIds = Workspace::query()->where('user_id', $user->id)->pluck('id')->all();

            foreach ($domainTables as $table) {
                // Registros de ex-miembros dentro de un estudio propio: se borran con el estudio.
                if ($ownedIds !== []) {
                    DB::table($table)->whereIn('workspace_id', $ownedIds)->where('user_id', '!=', $user->id)
                        ->update(['user_id' => $user->id]);
                }

                // Registros propios en estudios ajenos: pasan al propietario de ese estudio.
                $this->reassignToWorkspaceOwners($table, $user);
            }

            $user->tokens()->delete();
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            WorkspaceMembership::query()->where('user_id', $user->id)->delete();

            // Los estudios propios y todo lo que cuelga del usuario caen por `ON DELETE CASCADE`.
            $user->delete();
        });

        return true;
    }

    /** @return list<string> */
    private function domainTables(): array
    {
        return collect(Schema::getTableListing(schema: null, schemaQualified: false))
            ->reject(fn (string $table) => in_array($table, self::SKIP_TABLES, true))
            ->filter(fn (string $table) => Schema::hasColumns($table, ['user_id', 'workspace_id']))
            ->values()
            ->all();
    }

    private function reassignToWorkspaceOwners(string $table, User $user): void
    {
        $others = Workspace::query()
            ->where('user_id', '!=', $user->id)
            ->whereIn('id', DB::table($table)->where('user_id', $user->id)->whereNotNull('workspace_id')->select('workspace_id'))
            ->get(['id', 'user_id']);

        foreach ($others as $workspace) {
            DB::table($table)
                ->where('user_id', $user->id)
                ->where('workspace_id', $workspace->id)
                ->update(['user_id' => $workspace->user_id]);
        }
    }
}
