<?php

namespace Tests\Feature;

use App\Services\DataBackupService;
use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

class BackupScheduleTest extends TestCase
{
    public function test_runner_is_restricted_and_never_publishes_plaintext_dumps(): void
    {
        $workflow = file_get_contents(base_path('../.github/workflows/production-backup.yml'));
        $this->assertStringContainsString('cron: "0 3 * * *"', $workflow);
        $this->assertStringContainsString('workflow_dispatch:', $workflow);
        $this->assertStringNotContainsString('pull_request:', $workflow);
        $this->assertStringContainsString("github.repository == 'AVL05/lumaflow-studio'", $workflow);
        $this->assertStringContainsString("github.ref == 'refs/heads/main'", $workflow);
        $this->assertStringContainsString('group: production-backup', $workflow);
        $this->assertStringContainsString('cancel-in-progress: false', $workflow);
        $this->assertStringContainsString('php artisan data:backup --no-interaction', $workflow);
        $this->assertStringContainsString('openssl enc -aes-256-cbc -pbkdf2', $workflow);
        // El repositorio es publico: solo el fichero cifrado y la huella pueden salir como artefacto.
        $this->assertSame(1, preg_match('/upload-artifact@v\d+\n(?:.*\n)*?\s+path: \|\n((?:\s+\S.*\n)+)/', $workflow, $upload));
        $this->assertStringContainsString('*.enc', $upload[1]);
        $this->assertStringNotContainsString('.sql.gz\n', $upload[1]);
        $this->assertStringNotContainsString('*.sql.gz', $upload[1]);
        $this->assertStringContainsString('if: always()', $workflow);
        $this->assertStringContainsString('rm -f "$file.check" "$file"', $workflow);
    }

    public function test_runner_only_reads_secrets_inside_steps_and_fails_fast_without_them(): void
    {
        $workflow = file_get_contents(base_path('../.github/workflows/production-backup.yml'));
        $this->assertSame(1, preg_match('/^    if: (.+)$/m', $workflow, $match));
        $this->assertSame(
            "github.repository == 'AVL05/lumaflow-studio' && github.ref == 'refs/heads/main'",
            trim($match[1])
        );
        $beforeSteps = substr($workflow, 0, strpos($workflow, '    steps:'));
        $this->assertStringNotContainsString('secrets.', $beforeSteps);
        foreach (['PROD_DB_HOST', 'PROD_DB_PORT', 'PROD_DB_DATABASE', 'PROD_DB_USERNAME', 'PROD_DB_PASSWORD', 'BACKUP_ENCRYPTION_PASSPHRASE'] as $secret) {
            $this->assertStringContainsString("secrets.{$secret}", $workflow);
        }
        $this->assertStringContainsString('exit 1', $workflow);
        $this->assertStringNotContainsString('echo "$BACKUP_ENCRYPTION_PASSPHRASE"', $workflow);
    }

    public function test_maintenance_workflow_runs_the_token_purge_daily(): void
    {
        $workflow = file_get_contents(base_path('../.github/workflows/scheduled-maintenance.yml'));
        $this->assertStringContainsString('cron: "30 2 * * *"', $workflow);
        $this->assertStringNotContainsString('pull_request:', $workflow);
        $this->assertStringContainsString("github.ref == 'refs/heads/main'", $workflow);
        $this->assertStringContainsString('php artisan sanctum:prune-expired --hours=24', $workflow);
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

    public function test_scheduler_only_declares_the_token_purge(): void
    {
        $commands = collect(app(Schedule::class)->events())->map(fn ($event) => (string) $event->command);

        // El backup lo lanza GitHub Actions (production-backup.yml), no el scheduler de Laravel.
        $this->assertTrue($commands->contains(fn (string $command) => str_contains($command, 'sanctum:prune-expired')));
        $this->assertFalse($commands->contains(fn (string $command) => str_contains($command, 'data:backup')));
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
