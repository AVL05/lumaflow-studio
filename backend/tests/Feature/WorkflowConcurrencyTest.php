<?php

namespace Tests\Feature;

use App\Models\Job;
use App\Models\User;
use App\Services\JobWorkflowService;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class WorkflowConcurrencyTest extends TestCase
{
    public function test_parallel_applications_and_stale_stage_edits_preserve_data(): void
    {
        $prefix = tempnam(sys_get_temp_dir(), 'lf-workflow-');
        $database = $prefix.'.sqlite';
        touch($database);
        $processes = [];
        try {
            config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $database]);
            DB::purge('sqlite');
            $this->artisan('migrate:fresh', ['--force' => true])->assertExitCode(0);
            DB::statement('PRAGMA journal_mode=WAL');
            $owner = User::factory()->create();
            $job = Job::create(['user_id' => $owner->id, 'title' => 'Synthetic workflow race']);
            $hash = app(JobWorkflowService::class)->preview($job, config('project_templates.portrait'))['hash'];
            foreach (['apply-template', 'edit-stage'] as $round => $action) {
                $start = $prefix.'.start-'.$round;
                $workers = [];
                $stageId = $action === 'edit-stage' ? $job->stages()->first()->id : 0;
                foreach ([0, 1] as $index) {
                    $ready = $prefix.'.ready-'.$round.'-'.$index;
                    $worker = new Process([PHP_BINARY, base_path('tests/Fixtures/production-worker.php'), $database, (string) $job->id, (string) $stageId, $ready, $start, $action, $hash], base_path(), ['APP_ENV' => 'testing', 'SENTRY_LARAVEL_DSN' => '', 'LOG_CHANNEL' => 'null']);
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
                $this->assertSame($action === 'edit-stage' ? ['conflict', 'ok'] : ['ok', 'ok'], $results);
                $this->assertSame(8, $job->stages()->count());
                $this->assertSame(12, $job->tasks()->count());
                $this->assertSame(9, $job->checklists()->count());
                $this->assertSame(1, DB::table('project_template_applications')->where('job_id', $job->id)->count());
            }
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
