<?php

use App\Models\ContractPortalLink;
use App\Models\Delivery;
use App\Services\ContractPortalService;
use App\Services\PublicDeliveryService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $argv[1], 'cache.default' => 'array']);
DB::purge('sqlite');
$isContract = in_array($argv[5], ['accept', 'reject'], true);
$delivery = $isContract ? ContractPortalLink::query()->with('contract')->findOrFail((int) $argv[2]) : Delivery::query()->findOrFail((int) $argv[2]);
touch($argv[3]);
$deadline = microtime(true) + 10;
while (! is_file($argv[4])) {
    if (microtime(true) > $deadline) {
        throw new RuntimeException('Synthetic concurrency barrier timed out.');
    }
    usleep(10000);
}
try {
    $service = app($isContract ? ContractPortalService::class : PublicDeliveryService::class);
    if ($isContract) {
        $service->{$argv[5]}($delivery);
    } elseif ($argv[5] === 'approve') {
        $service->approve($delivery);
    } else {
        $service->requestChanges($delivery, 'Synthetic correction');
    }
} catch (HttpException $exception) {
    // An approval winning the race legitimately rejects a later correction.
    if ((! $isContract && $argv[5] !== 'changes') || $exception->getStatusCode() !== 422) {
        fwrite(STDERR, $exception::class);
        exit(1);
    }
} catch (Throwable $exception) {
    fwrite(STDERR, $exception::class);
    exit(1);
}
echo 'ok';
