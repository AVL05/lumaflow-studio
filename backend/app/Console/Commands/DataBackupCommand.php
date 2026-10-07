<?php

namespace App\Console\Commands;

use App\Services\DataBackupService;
use App\Services\RemoteBackupService;
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
        {--remote : Sube y verifica en backup_s3, luego limpia el dump local}
        {--prune : Aplica la retencion tras generar el backup}
        {--keep-daily=7 : Dias distintos a conservar}
        {--keep-weekly=4 : Semanas anteriores a conservar}
        {--dry-run : Muestra que se eliminaria sin borrar}';

    protected $description = 'Genera un backup comprimido y verificado de la base de datos.';

    public function handle(DataBackupService $backups, RemoteBackupService $remote): int
    {
        $lock = null;
        try {
            // Lock de archivo portable (sin Redis): evita dos backups a la vez.
            $lock = fopen($backups->backupDirectory().DIRECTORY_SEPARATOR.'.backup.lock', 'c');
            if ($lock === false) {
                throw new \RuntimeException('No se pudo abrir el lock de backup.');
            }
            if (! flock($lock, LOCK_EX | LOCK_NB)) {
                $this->info('Otro backup en curso, se omite esta ejecucion.');

                return self::SUCCESS;
            }

            return $this->runBackup($backups, $remote);
        } catch (\Throwable $exception) {
            // No propagar mensajes de drivers que pueden contener credenciales.
            $this->error('Backup fallido. Revise binarios, almacenamiento, TLS y conectividad en privado.');
            report(new \RuntimeException('data:backup fallo: '.get_class($exception)));

            return self::FAILURE;
        } finally {
            if (is_resource($lock)) {
                flock($lock, LOCK_UN);
                fclose($lock);
            }
        }
    }

    private function runBackup(DataBackupService $backups, RemoteBackupService $remote): int
    {
        $result = null;
        try {
            if ($this->option('remote')) {
                $remote->assertConfigured();
            }
            $result = $backups->backup();
            if ($this->option('remote')) {
                $remote->upload($result['file']);
            }

            $this->info($this->option('remote') ? 'Backup remoto verificado: '.basename($result['file']) : "Backup generado: {$result['file']}");
            $this->table(
                ['Archivo', 'Bytes', 'SHA-256', 'Motor'],
                [[basename($result['file']), $result['bytes'], substr($result['sha256'], 0, 16).'…', $result['driver']]]
            );

            if ($this->option('prune')) {
                $pruned = ($this->option('remote') ? $remote : $backups)->prune(
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
        } finally {
            if ($this->option('remote') && $result !== null) {
                foreach ([$result['file'], $result['file'].'.sha256'] as $file) {
                    if (is_file($file) && ! unlink($file)) {
                        throw new \RuntimeException('No se pudo limpiar el backup temporal.');
                    }
                }
            }
        }
    }
}
