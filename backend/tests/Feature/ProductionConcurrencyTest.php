<?php

namespace Tests\Feature;

use App\Models\Job;
use App\Models\Shot;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ProductionConcurrencyTest extends TestCase
{
    public function test_parallel_moves_creates_and_stale_notes_preserve_integrity(): void
    {
        $prefix = tempnam(sys_get_temp_dir(), 'lf-production-');
        $database = $prefix.'.sqlite';
        touch($database);
        $processes = [];
        try {
            config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $database]);
            DB::purge('sqlite');
            $this->artisan('migrate:fresh', ['--force' => true])->assertExitCode(0);
            DB::statement('PRAGMA journal_mode=WAL');
            $owner = User::factory()->create();
            $job = Job::create(['user_id' => $owner->id, 'title' => 'Synthetic race']);
            $shots = [];
            for ($i = 1; $i <= 3; $i++) {
                $shots[] = Shot::create(['user_id' => $owner->id, 'workspace_id' => $job->workspace_id, 'job_id' => $job->id, 'description' => 'Synthetic '.$i, 'position' => $i]);
            }
            foreach (['move', 'create', 'notes'] as $round => $action) {
                $start = $prefix.'.start-'.$round;
                $workers = [];
                foreach ([0, 1] as $index) {
                    $ready = $prefix.'.ready-'.$round.'-'.$index;
                    $shot = $action === 'move' ? $shots[$index + 1] : $shots[0];
                    $worker = new Process([PHP_BINARY, base_path('tests/Fixtures/production-worker.php'), $database, (string) $job->id, (string) $shot->id, $ready, $start, $action], base_path(), ['APP_ENV' => 'testing', 'SENTRY_LARAVEL_DSN' => '', 'LOG_CHANNEL' => 'null']);
                    $worker->setTimeout(30)->start();
                    $processes[] = $worker;
                    $workers[] = [$worker, $ready];
                }
                $deadline = microtime(true) + 15;
                while (! is_file($workers[0][1]) || ! is_file($workers[1][1])) {
                    $this->assertLessThan($deadline, microtime(true), 'Workers must reach the barrier.');
                    usleep(10000);
                }
                touch($start);
                $results = [];
                foreach ($workers as [$worker]) {
                    $worker->wait();
                    $this->assertTrue($worker->isSuccessful(), $worker->getErrorOutput());
                    $results[] = trim($worker->getOutput());
                }
                sort($results);
                $this->assertSame($action === 'notes' ? ['conflict', 'ok'] : ['ok', 'ok'], $results);
                $count = $action === 'move' ? 3 : 5;
                $this->assertSame($count, $job->shots()->count());
                $this->assertSame($count, $job->shots()->distinct()->count('position'));
            }
            $this->assertSame(1, $shots[0]->fresh()->revision);
        } finally {
            foreach ($processes as $process) {
                if ($process->isRunning()) {
                    $process->stop();
                }
            }
            DB::purge('sqlite');
            foreach ([$prefix, $database, $database.'-wal', $database.'-shm', ...glob($prefix.'.ready-*'), ...glob($prefix.'.start-*')] as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }
    }
}
