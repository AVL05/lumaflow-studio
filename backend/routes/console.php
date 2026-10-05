<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Estrategia declarada (Issue #12): backup diario con retencion.
// Requiere un runner de `schedule:run` cada minuto (cron del proveedor);
// sin runner estas entradas no se ejecutan. Ver docs/backup-recovery.md.
Schedule::command('data:backup --prune')->dailyAt('03:00');
