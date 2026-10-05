<?php

namespace App\Console\Commands;

use App\Services\DataBackupService;
use Illuminate\Console\Command;

/**
 * Genera un backup versionado de la base de datos (Issue #12).
 *
 * Nunca imprime secretos ni connection strings: solo archivo, tamano,
 * checksum y motor. Reporta el fallo a observabilidad cuando existe.
 */
class DataBackupCommand extends Command
{
    protected $signature = 'data:backup
        {--prune : Aplica la retencion tras generar el backup}
        {--keep-daily=7 : Dias distintos a conservar}
        {--keep-weekly=4 : Semanas anteriores a conservar}
        {--dry-run : Muestra que se eliminaria sin borrar}';

    protected $description = 'Genera un backup comprimido y verificado de la base de datos.';

    public function handle(DataBackupService $backups): int
    {
        try {
            $result = $backups->backup();
        } catch (\Throwable $exception) {
            $this->error('Backup fallido: '.$exception->getMessage());
            report($exception);

            return self::FAILURE;
        }

        $this->info("Backup generado: {$result['file']}");
        $this->table(
            ['Archivo', 'Bytes', 'SHA-256', 'Motor'],
            [[basename($result['file']), $result['bytes'], substr($result['sha256'], 0, 16).'…', $result['driver']]]
        );

        if ($this->option('prune')) {
            $pruned = $backups->prune(
                (int) $this->option('keep-daily'),
                (int) $this->option('keep-weekly'),
                (bool) $this->option('dry-run')
            );

            if ($pruned['deleted'] === []) {
                $this->info('Retencion: nada que eliminar.');
            } else {
                foreach ($pruned['deleted'] as $name) {
                    $this->line(($this->option('dry-run') ? '[dry-run] Eliminaria: ' : 'Eliminado: ').$name);
                }
            }
        }

        return self::SUCCESS;
    }
}
