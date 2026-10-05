<?php

namespace Tests\Unit;

use App\Services\DataBackupService;
use PHPUnit\Framework\TestCase;

class DataBackupServiceTest extends TestCase
{
    public function test_filename_has_no_pii_and_sorted_format(): void
    {
        $name = DataBackupService::filename(new \DateTimeImmutable('2026-10-05 12:00:00'), 'mysql');

        $this->assertSame('lumaflow-db-20261005-120000-mysql.sql.gz', $name);
    }

    public function test_only_generated_backups_are_recognized(): void
    {
        $this->assertTrue(DataBackupService::isRecognizedBackup('/x/lumaflow-db-20261005-120000-mysql.sql.gz'));
        $this->assertFalse(DataBackupService::isRecognizedBackup('/x/lumaflow-db-20261005-120000-mysql.sql'));
        // El traversal queda neutralizado por basename: resuelve dentro del dir.
        $this->assertSame(
            'lumaflow-db-20261005-120000-mysql.sql.gz',
            basename('/x/../lumaflow-db-20261005-120000-mysql.sql.gz')
        );
        $this->assertFalse(DataBackupService::isRecognizedBackup('/x/other.sql.gz'));
        $this->assertFalse(DataBackupService::isRecognizedBackup('/x/lumaflow-db-20261005-120000-mysql.sql.gz.sh'));
    }

    public function test_retention_keeps_daily_and_weekly_newest(): void
    {
        $now = new \DateTimeImmutable('2026-10-05');

        $files = [
            'lumaflow-db-20261005-120000-sqlite.sql.gz',
            'lumaflow-db-20261004-120000-sqlite.sql.gz',
            'lumaflow-db-20261004-110000-sqlite.sql.gz',
            'lumaflow-db-20260928-120000-sqlite.sql.gz',
            'lumaflow-db-20260921-120000-sqlite.sql.gz',
            'lumaflow-db-20260914-120000-sqlite.sql.gz',
            'lumaflow-db-20260907-120000-sqlite.sql.gz',
            'lumaflow-db-20260901-120000-sqlite.sql.gz',
        ];

        $delete = DataBackupService::selectForRetention($files, 7, 4, $now);

        // Duplicado del mismo dia y semanas mas alla de la cuarta se eliminan.
        $this->assertContains('lumaflow-db-20261004-110000-sqlite.sql.gz', $delete);
        $this->assertContains('lumaflow-db-20260901-120000-sqlite.sql.gz', $delete);
        $this->assertNotContains('lumaflow-db-20261005-120000-sqlite.sql.gz', $delete);
        $this->assertNotContains('lumaflow-db-20260928-120000-sqlite.sql.gz', $delete);
    }

    public function test_checksum_roundtrip(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'lumaflow-sha-');
        file_put_contents($file, 'contenido sintético');

        $sha = DataBackupService::sha256($file);

        $this->assertSame(hash('sha256', 'contenido sintético'), $sha);

        unlink($file);
    }

    public function test_mysql_command_has_no_password_in_argv(): void
    {
        $argv = DataBackupService::buildMysqlDumpCommand([
            'host' => 'db.internal', 'port' => '3306', 'username' => 'app', 'password' => 's3cr3t', 'database' => 'lumaflow',
        ]);

        $this->assertSame('mysqldump', $argv[0]);
        $this->assertContains('--single-transaction', $argv);
        $this->assertContains('lumaflow', $argv);
        $this->assertStringNotContainsString('s3cr3t', implode(' ', $argv));
    }
}
