<?php

use App\Models\Job;
use App\Models\PostproductionStage;
use App\Models\Shot;
use App\Models\User;
use App\Services\JobWorkflowService;
use App\Services\ProductionService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $argv[1], 'cache.default' => 'array']);
DB::purge('sqlite');
$job = Job::findOrFail((int) $argv[2]);
$workflow = in_array($argv[6], ['apply-template', 'edit-stage'], true);
$shot = $workflow ? null : Shot::findOrFail((int) $argv[3]);
$stage = $argv[6] === 'edit-stage' ? PostproductionStage::findOrFail((int) $argv[3]) : null;
$actor = User::findOrFail($job->user_id);
touch($argv[4]);
$deadline = microtime(true) + 15;
while (! is_file($argv[5])) {
    if (microtime(true) > $deadline) {
        throw new RuntimeException('Synthetic production barrier timed out.');
    }
    usleep(10000);
}
try {
    $service = app(ProductionService::class);
    match ($argv[6]) {
        'apply-template' => app(JobWorkflowService::class)->applyTemplate($actor, $job, 'portrait', $argv[7]),
        'edit-stage' => app(JobWorkflowService::class)->updateStage($actor, $job, $stage, ['notes' => 'Synthetic parallel stage notes', 'revision' => $stage->revision]),
        'move' => $service->move($job, $shot, 'up'),
        'create' => $service->saveShot($actor, $job, null, ['description' => 'Synthetic parallel shot']),
        'notes' => $service->saveShot($actor, $job, $shot, ['notes' => 'Synthetic parallel notes', 'revision' => $shot->revision]),
    };
    echo 'ok';
} catch (HttpException $exception) {
    if ($exception->getStatusCode() !== 409 || ! in_array($argv[6], ['notes', 'edit-stage'], true)) {
        throw $exception;
    }
    echo 'conflict';
}
