<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Render no ejecuta `schedule:run`. El backup diario (production-backup.yml) y el mantenimiento
// (scheduled-maintenance.yml) los lanza GitHub Actions llamando a los comandos directamente.
// Esta entrada solo se aplica si algun dia hay un runner de `schedule:run` en el hosting.
Schedule::command('sanctum:prune-expired --hours=24')->daily()->timezone('UTC');
