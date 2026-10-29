<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Contract;
use App\Models\ContractPortalLink;
use App\Models\Delivery;
use App\Models\Job;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class DeliveryConcurrencyTest extends TestCase
{
    public function test_parallel_stale_readers_emit_one_approval_and_preserve_concurrent_comment(): void
    {
        $prefix = tempnam(sys_get_temp_dir(), 'lf-delivery-race-');
        $database = $prefix.'.sqlite';
        touch($database);
        $processes = [];
        try {
            config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $database]);
            DB::purge('sqlite');
            $this->artisan('migrate:fresh', ['--force' => true])->assertExitCode(0);
            DB::statement('PRAGMA journal_mode=WAL');
            $owner = User::factory()->create();
            $client = Client::create(['user_id' => $owner->id, 'name' => 'Synthetic', 'status' => 'active']);
            $job = Job::create(['user_id' => $owner->id, 'client_id' => $client->id, 'title' => 'Synthetic', 'specialty' => 'general', 'workflow_key' => 'general', 'status' => 'lead', 'contract_status' => 'sent']);
            foreach ([['approve', 'approve'], ['changes', 'approve'], ['changes', 'changes'], ['accept', 'accept'], ['reject', 'reject'], ['accept', 'reject']] as $round => $actions) {
                $isContract = in_array($actions[0], ['accept', 'reject'], true);
                if ($isContract) {
                    $delivery = Contract::create(['user_id' => $owner->id, 'client_id' => $client->id, 'job_id' => $job->id, 'contract_number' => 'CON-RACE-'.$round, 'title' => 'Synthetic concurrent contract', 'status' => 'sent', 'content' => 'Synthetic terms', 'content_snapshot' => 'Synthetic terms']);
                    $link = ContractPortalLink::create(['contract_id' => $delivery->id, 'token_hash' => hash('sha256', 'synthetic-'.$round), 'expires_at' => now()->addDay()]);
                    $workerId = $link->id;
                } else {
                    $delivery = Delivery::create(['user_id' => $owner->id, 'client_id' => $client->id, 'title' => 'Synthetic concurrent delivery', 'status' => 'delivered']);
                    $workerId = $delivery->id;
                }
                $before = $owner->notifications()->count();
                $start = $prefix.'.start-'.$round;
                $workers = [];
                foreach ($actions as $index => $action) {
                    $ready = $prefix.'.ready-'.$round.'-'.$index;
                    $process = new Process([PHP_BINARY, base_path('tests/Fixtures/delivery-response-worker.php'), $database, (string) $workerId, $ready, $start, $action], base_path(), ['APP_ENV' => 'testing', 'SENTRY_LARAVEL_DSN' => '', 'LOG_CHANNEL' => 'null']);
                    $process->setTimeout(20)->start();
                    $processes[] = $process;
                    $workers[] = [$process, $ready];
                }
                $deadline = microtime(true) + 10;
                while (! is_file($workers[0][1]) || ! is_file($workers[1][1])) {
                    $this->assertLessThan($deadline, microtime(true), 'Workers must reach the barrier.');
                    usleep(10000);
                }
                touch($start);
                foreach ($workers as [$process]) {
                    $process->wait();
                    $this->assertTrue($process->isSuccessful(), $process->getErrorOutput());
                    $this->assertSame('ok', trim($process->getOutput()));
                }
                $transitions = Activity::query()->where('subject_id', $delivery->id)->where('subject_type', $delivery::class)->where('type', 'status_changed')->count();
                $comments = Activity::query()->where('subject_id', $delivery->id)->where('subject_type', $delivery::class)->where('type', 'comment')->count();
                $this->assertSame($before + $transitions + $comments, $owner->notifications()->count());
                if ($isContract) {
                    $this->assertContains($delivery->fresh()->status, ['accepted', 'rejected']);
                    $this->assertSame(1, $transitions);
                } else {
                    $approved = in_array('approve', $actions, true);
                    $this->assertSame($approved ? 'approved' : 'delivered', $delivery->fresh()->status);
                    $this->assertSame($approved ? 1 : 0, $transitions);
                    $this->assertSame($comments ? 'Synthetic correction' : null, $delivery->fresh()->client_message);
                    if (! $approved) {
                        $this->assertSame(1, $comments);
                    }
                }
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
