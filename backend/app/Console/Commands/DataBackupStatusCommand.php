<?php

namespace App\Console\Commands;

use App\Services\DataBackupService;
use Illuminate\Console\Command;

/**
 * Estado operativo de backups (Issue #24).
 *
 * Responde "¿Se hizo el backup de hoy?" sin exponer secretos: ultimo
 * backup, edad, checksum y aviso STALE si supera ~36h. Informativo
 * (exit 0); no forma parte del readiness.
 */
class DataBackupStatusCommand extends Command
{
    protected $signature = 'data:backup-status';

    protected $description = 'Muestra el ultimo backup, su edad y su checksum.';

    public function handle(DataBackupService $backups): int
    {
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
                $ageHours !== null && $ageHours > 36 ? 'STALE' : 'OK',
            ]]
        );

        return self::SUCCESS;
    }
}
