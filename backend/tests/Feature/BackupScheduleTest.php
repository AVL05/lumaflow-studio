<?php

namespace Tests\Feature;

use App\Services\DataBackupService;
use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

class BackupScheduleTest extends TestCase
{
    public function test_mysql_tls_args_only_with_configured_ca(): void
    {
        $attr = DataBackupService::sslCaAttribute();

        if ($attr === null) {
            $this->markTestSkipped('Sin driver MySQL en este entorno.');
        }

        $withCa = DataBackupService::mysqlTlsArgs([
            'options' => [$attr => '/etc/ssl/certs/ca.pem'],
        ]);

        $this->assertSame(['--ssl-ca=/etc/ssl/certs/ca.pem'], $withCa);

        $this->assertSame([], DataBackupService::mysqlTlsArgs([]));
        $this->assertSame([], DataBackupService::mysqlTlsArgs(['options' => []]));
    }

    public function test_schedule_declares_daily_pruned_backup(): void
    {
        $events = collect(app(Schedule::class)->events());

        $backup = $events->first(fn ($event) => str_contains((string) $event->command, 'data:backup'));

        $this->assertNotNull($backup);
        $this->assertStringContainsString('--prune', (string) $backup->command);
        $this->assertSame('0 3 * * *', $backup->expression);
    }

    public function test_status_reports_last_backup_and_stale(): void
    {
        $service = app(DataBackupService::class);
        $old = 'lumaflow-db-20200101-030000-sqlite.sql.gz';
        $oldPath = $service->backupDirectory().DIRECTORY_SEPARATOR.$old;
        file_put_contents($oldPath, gzencode('-- sqlite'));

        try {
            $this->artisan('data:backup-status')
                ->expectsOutputToContain('STALE')
                ->assertExitCode(0);
        } finally {
            @unlink($oldPath);
        }
    }

    public function test_status_without_backups_is_clear(): void
    {
        $service = app(DataBackupService::class);
        $preExisting = $service->listBackups();
        $this->assertSame([], $preExisting);

        $this->artisan('data:backup-status')
            ->expectsOutputToContain('Sin backups')
            ->assertExitCode(0);
    }

    public function test_overlapping_backup_is_skipped(): void
    {
        $service = app(DataBackupService::class);
        $lock = fopen($service->backupDirectory().DIRECTORY_SEPARATOR.'.backup.lock', 'c');
        flock($lock, LOCK_EX | LOCK_NB);

        try {
            $this->artisan('data:backup')
                ->expectsOutputToContain('se omite')
                ->assertExitCode(0);
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }

        $this->assertSame([], array_diff($service->listBackups(), []));
    }
}
