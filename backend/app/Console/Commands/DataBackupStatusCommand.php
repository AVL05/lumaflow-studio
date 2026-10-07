<?php

namespace App\Console\Commands;

use App\Services\DataBackupService;
use App\Services\RemoteBackupService;
use Illuminate\Console\Command;

/**
 * Estado operativo de backups (Issue #24).
 *
 * Responde "¿Se hizo el backup de hoy?" sin exponer secretos: ultimo
 * backup, edad, checksum y aviso STALE si supera ~36h. Informativo
 * local (exit 0); remoto falla si no es verificable o esta STALE.
 * No forma parte del readiness.
 */
class DataBackupStatusCommand extends Command
{
    protected $signature = 'data:backup-status {--remote : Verifica ultimo backup en B2}';

    protected $description = 'Muestra el ultimo backup, su edad y su checksum.';

    public function handle(DataBackupService $backups, RemoteBackupService $remote): int
    {
        if ($this->option('remote')) {
            try {
                $names = $remote->listBackups();
                if ($names === []) {
                    $this->warn('Sin backups remotos.');

                    return self::FAILURE;
                }
                $last = $remote->verify($names[0]);
                $date = DataBackupService::parseBackupDate($last['name']);
                $age = (time() - $date->getTimestamp()) / 3600;
                $this->table(['Archivo', 'Timestamp UTC', 'Bytes', 'Edad', 'Estado'], [[
                    $last['name'], $date->format('Y-m-d H:i:s'), $last['bytes'], sprintf('%.1f h', $age), $age > 36 ? 'STALE' : 'OK',
                ]]);

                $this->line('SHA-256: '.$last['sha256']);

                return $age > 36 ? self::FAILURE : self::SUCCESS;
            } catch (\Throwable $exception) {
                $this->error('Estado remoto FALLO. Revise configuracion B2 y checksum en privado.');
                report(new \RuntimeException('data:backup-status fallo: '.get_class($exception)));

                return self::FAILURE;
            }
        }
        $names = $backups->listBackups();

        if ($names === []) {
            $this->warn('Sin backups. Ejecute php artisan data:backup.');

            return self::SUCCESS;
        }

        rsort($names);
        $latest = $names[0];
        $file = $backups->backupDirectory().DIRECTORY_SEPARATOR.$latest;
        $date = DataBackupService::parseBackupDate($latest);
        $ageHours = $date ? (time() - $date->getTimestamp()) / 3600 : null;
        $checksum = $backups->verifyChecksum($file);

        $this->table(
            ['Archivo', 'Bytes', 'Edad', 'Checksum', 'Estado'],
            [[
                $latest,
                filesize($file),
                $ageHours === null ? 'desconocida' : sprintf('%.1f h', $ageHours),
                $checksum ? 'OK' : 'FALLO',
                ! $checksum ? 'FALLO' : ($ageHours !== null && $ageHours > 36 ? 'STALE' : 'OK'),
            ]]
        );

        return self::SUCCESS;
    }
}
