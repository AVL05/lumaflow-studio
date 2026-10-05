<?php

namespace App\Console\Commands;

use App\Services\DataBackupService;
use Illuminate\Console\Command;

/**
 * Verifica y restaura backups (Issue #12).
 *
 * Por defecto solo hace drill de verificacion en destino temporal aislado.
 * Aplicar sobre la base real exige --apply, y en produccion ademas
 * --force-production con confirmacion. Nunca imprime secretos.
 */
class DataRestoreCommand extends Command
{
    protected $signature = 'data:restore
        {file : Basename del backup dentro de storage/backups}
        {--apply : Aplica sobre la base configurada tras verificar}
        {--force : Omite la confirmacion interactiva}
        {--force-production : Permite aplicar en produccion}';

    protected $description = 'Verifica un backup en entorno aislado y opcionalmente lo restaura.';

    public function handle(DataBackupService $backups): int
    {
        $dir = $backups->backupDirectory();
        $file = $dir.DIRECTORY_SEPARATOR.basename((string) $this->argument('file'));

        if (! DataBackupService::isRecognizedBackup($file) || ! is_file($file)) {
            $this->error('Backup no reconocido o inexistente. Solo archivos lumaflow-db-*.sql.gz del directorio de backups.');

            return self::FAILURE;
        }

        if (! $backups->verifyChecksum($file)) {
            $this->error('Checksum invalido: el backup puede estar corrupto.');

            return self::FAILURE;
        }

        $driver = $this->driverFromFilename($file);

        try {
            $check = $backups->verifyBackup($file, $driver);
        } catch (\Throwable $exception) {
            $this->error('Verificacion fallida: '.$exception->getMessage());
            report($exception);

            return self::FAILURE;
        }

        $this->info("Verificacion OK: {$check['tables']} tablas".($check['users'] === null ? '' : ", {$check['users']} usuarios").'.');

        if (! $this->option('apply')) {
            $this->info('Drill completado en destino temporal. Use --apply para restaurar de verdad.');

            return self::SUCCESS;
        }

        if (app()->isProduction() && ! $this->option('force-production')) {
            $this->error('Restaurar produccion exige --force-production.');

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm("Restaurar {$file} sobre la base {$driver} actual?")) {
            $this->info('Cancelado.');

            return self::SUCCESS;
        }

        try {
            if ($driver === 'sqlite') {
                $target = (string) config('database.connections.sqlite.database');
                $backups->applySqlite($file, $target);
            } else {
                $backups->applyMysql($file, $driver);
            }
        } catch (\Throwable $exception) {
            $this->error('Restauracion fallida: '.$exception->getMessage());
            report($exception);

            return self::FAILURE;
        }

        $this->info('Restauracion aplicada. Valide migraciones y datos antes de reabrir trafico.');

        return self::SUCCESS;
    }

    private function driverFromFilename(string $file): string
    {
        preg_match('/-(mysql|mariadb|pgsql|sqlite)\.sql\.gz\z/', basename($file), $match);

        return $match[1] ?? (string) config('database.default');
    }
}
