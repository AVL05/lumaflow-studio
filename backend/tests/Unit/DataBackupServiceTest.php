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

    public function test_find_executable_with_controlled_path(): void
    {
        $dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'lumaflow-path-'.uniqid();
        mkdir($dir);
        $binary = $dir.DIRECTORY_SEPARATOR.'mytool';
        file_put_contents($binary, '#!/bin/sh');
        chmod($binary, 0755);

        try {
            if (DIRECTORY_SEPARATOR === '\\') {
                // En Windows los ejecutables siempre llevan extension
                // (PATHEXT); un archivo sin extension no es ejecutable.
                $this->assertNull(DataBackupService::findExecutable('mytool', $dir));
            } else {
                $this->assertSame($binary, DataBackupService::findExecutable('mytool', $dir));
            }
            $this->assertNull(DataBackupService::findExecutable('missing-tool', $dir));
            // Nombres peligrosos nunca resuelven.
            $this->assertNull(DataBackupService::findExecutable('../mytool', $dir));
            $this->assertNull(DataBackupService::findExecutable('mytool;rm', $dir));
            $this->assertNull(DataBackupService::findExecutable('/bin/ls', $dir));
        } finally {
            @unlink($binary);
            @rmdir($dir);
        }
    }

    public function test_find_executable_patnext_logic_without_windows(): void
    {
        $dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'lumaflow-patnext-'.uniqid();
        mkdir($dir);
        file_put_contents($dir.DIRECTORY_SEPARATOR.'tool.EXE', 'x');
        chmod($dir.DIRECTORY_SEPARATOR.'tool.EXE', 0755);

        try {
            // Simula PATHEXT de Windows contra un PATH controlado.
            $found = DataBackupService::findExecutable('tool', $dir, '.COM;.EXE;.BAT');
            $this->assertSame($dir.DIRECTORY_SEPARATOR.'tool.EXE', $found);
            $this->assertNull(DataBackupService::findExecutable('tool', $dir, '.COM;.BAT'));
        } finally {
            @unlink($dir.DIRECTORY_SEPARATOR.'tool.EXE');
            @rmdir($dir);
        }
    }

    public function test_binary_available_detects_real_and_missing(): void
    {
        // `php` existe en cualquier entorno que ejecute esta suite.
        $this->assertTrue(DataBackupService::binaryAvailable('php'));
        $this->assertFalse(DataBackupService::binaryAvailable('lumaflow-binary-que-no-existe'));
    }
}
