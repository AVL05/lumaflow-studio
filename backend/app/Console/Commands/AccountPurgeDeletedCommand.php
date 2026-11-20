<?php

namespace App\Console\Commands;

use App\Services\AccountDeletionService;
use App\Support\AuditLog;
use Illuminate\Console\Command;
use Throwable;

class AccountPurgeDeletedCommand extends Command
{
    protected $signature = 'account:purge-deleted {--dry-run : Lista las cuentas vencidas sin borrar nada}';

    protected $description = 'Elimina las cuentas cuyo periodo de gracia de borrado ha vencido.';

    public function handle(AccountDeletionService $deletion): int
    {
        $due = $deletion->due();

        if ($due->isEmpty()) {
            $this->info('No hay cuentas vencidas.');

            return self::SUCCESS;
        }

        $failed = 0;

        foreach ($due as $user) {
            if ($this->option('dry-run')) {
                $this->line("[dry-run] cuenta #{$user->id} vencida");

                continue;
            }

            try {
                if ($deletion->purge($user)) {
                    AuditLog::authSucceeded('account_purged', $user->id);
                    $this->line("Cuenta #{$user->id} eliminada.");
                } else {
                    $failed++;
                    $this->warn("Cuenta #{$user->id} omitida: su estudio tiene miembros otra vez.");
                }
            } catch (Throwable $exception) {
                $failed++;
                // Sin datos personales: solo id y clase de excepcion.
                $this->error("Cuenta #{$user->id}: fallo al eliminar (".$exception::class.').');
            }
        }

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
