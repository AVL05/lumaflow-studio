<?php

namespace Tests\Feature;

use App\Services\DataBackupService;
use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

class BackupScheduleTest extends TestCase
{
    public function test_runner_is_restricted_and_never_publishes_dumps(): void
    {
        $workflow = file_get_contents(base_path('../.github/workflows/production-backup.yml'));
        $this->assertStringContainsString('cron: "0 3 * * *"', $workflow);
        $this->assertStringContainsString('workflow_dispatch:', $workflow);
        $this->assertStringNotContainsString('pull_request:', $workflow);
        $this->assertStringContainsString("github.repository == 'AVL05/lumaflow-studio'", $workflow);
        $this->assertStringContainsString("github.ref == 'refs/heads/main'", $workflow);
        $this->assertStringContainsString('group: production-backup', $workflow);
        $this->assertStringContainsString('cancel-in-progress: false', $workflow);
        $this->assertStringContainsString('php artisan data:backup --prune --no-interaction', $workflow);
        $this->assertStringContainsString('sha256sum --check --strict', $workflow);
        $this->assertStringContainsString('if: always()', $workflow);
        $this->assertStringNotContainsString('upload-artifact', $workflow);
    }

    public function test_configuration_failure_returns_failure_without_secrets(): void
    {
        $this->mock(DataBackupService::class, function ($mock) {
            $mock->shouldReceive('backupDirectory')->once()->andThrow(new \RuntimeException('secret-canary'));
        });

        $this->artisan('data:backup')
            ->doesntExpectOutputToContain('secret-canary')
            ->expectsOutputToContain('Backup fallido')
            ->assertExitCode(1);
    }

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
        $this->assertSame(['--ssl-ca=/etc/ssl/certs/ca.pem', '--ssl-mode=VERIFY_IDENTITY'], DataBackupService::mysqlTlsArgs([
            'driver' => 'mysql', 'options' => [$attr => '/etc/ssl/certs/ca.pem'],
        ]));

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
        $this->assertSame('UTC', $backup->timezone);
        $this->assertTrue($backup->withoutOverlapping);
        $this->assertSame(30, $backup->expiresAt);
    }

    public function test_backup_path_defaults_to_local_storage_and_can_use_private_storage(): void
    {
        $this->assertSame(storage_path('backups'), config('backup.path'));
        $dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'lumaflow-private-'.uniqid();
        config(['backup.path' => $dir]);

        try {
            $this->assertSame($dir, app(DataBackupService::class)->backupDirectory());
            $this->assertDirectoryExists($dir);
        } finally {
            @rmdir($dir);
        }
    }

    public function test_missing_checksum_is_not_reported_as_verified(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'lumaflow-no-checksum-');

        try {
            $this->assertFalse(app(DataBackupService::class)->verifyChecksum($file));
        } finally {
            @unlink($file);
        }
    }

    public function test_status_reports_last_backup_and_stale(): void
    {
        $service = app(DataBackupService::class);
        $old = 'lumaflow-db-20200101-030000-sqlite.sql.gz';
        $oldPath = $service->backupDirectory().DIRECTORY_SEPARATOR.$old;
        file_put_contents($oldPath, gzencode('-- sqlite'));
        file_put_contents($oldPath.'.sha256', DataBackupService::sha256($oldPath).'  '.$old);

        try {
            $this->artisan('data:backup-status')
                ->expectsOutputToContain('STALE')
                ->assertExitCode(0);
        } finally {
            @unlink($oldPath);
            @unlink($oldPath.'.sha256');
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
