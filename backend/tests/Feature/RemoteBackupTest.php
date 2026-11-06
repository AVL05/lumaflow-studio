<?php

namespace Tests\Feature;

use App\Services\DataBackupService;
use App\Services\RemoteBackupService;
use Aws\MockHandler;
use Aws\Result;
use Aws\S3\S3Client;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Filesystem;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class RemoteBackupTest extends TestCase
{
    private const CANARIES = ['b2-access-canary', 'b2-secret-canary', 'db-password-canary'];

    protected function setUp(): void
    {
        parent::setUp();
        config(['filesystems.disks.backup_s3' => [
            'driver' => 's3', 'key' => self::CANARIES[0], 'secret' => self::CANARIES[1],
            'bucket' => 'synthetic-backups', 'region' => 'us-west-004',
            'endpoint' => 'https://s3.us-west-004.backblazeb2.com',
            'visibility' => 'private', 'throw' => true, 'use_path_style_endpoint' => true,
        ], 'database.connections.mysql.password' => self::CANARIES[2]]);
        Storage::fake('backup_s3');
    }

    private function seedRemote(string $name): string
    {
        $dump = gzencode('CREATE TABLE migrations (id INTEGER); CREATE TABLE users (id INTEGER); INSERT INTO users VALUES (1);');
        Storage::disk('backup_s3')->put('database/'.$name, $dump);
        Storage::disk('backup_s3')->put('database/'.$name.'.sha256', hash('sha256', $dump).'  '.$name."\n");

        return $dump;
    }

    private function today(): string
    {
        return 'lumaflow-db-'.gmdate('Ymd').'-030000-sqlite.sql.gz';
    }

    public function test_synthetic_backup_upload_checksum_prune_download_and_restore_drill(): void
    {
        $db = tempnam(sys_get_temp_dir(), 'b2-synthetic-');
        $dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'b2-local-'.bin2hex(random_bytes(8));
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $db, 'backup.path' => $dir]);
        DB::purge('sqlite');
        DB::statement('CREATE TABLE migrations (id INTEGER)');
        DB::statement('CREATE TABLE users (id INTEGER)');
        DB::statement('INSERT INTO users VALUES (1)');
        try {
            $this->artisan('data:backup --remote --prune')->expectsOutputToContain('Backup remoto verificado')->assertExitCode(0);
            $names = app(RemoteBackupService::class)->listBackups();
            $this->assertCount(1, $names);
            $disk = Storage::disk('backup_s3');
            $disk->assertExists(['database/'.$names[0], 'database/'.$names[0].'.sha256']);
            $this->assertSame([], app(DataBackupService::class)->listBackups());
            $verified = app(RemoteBackupService::class)->verify($names[0]);
            $this->assertSame(hash('sha256', $disk->get('database/'.$names[0])), $verified['sha256']);
            $this->assertGreaterThan(0, $verified['bytes']);
            $this->artisan('data:restore', ['file' => $names[0], '--remote' => true])->expectsOutputToContain('Drill completado')->assertExitCode(0);
            $this->assertSame(1, DB::table('users')->count());
            $this->app['env'] = 'production';
            $this->artisan('data:restore', ['file' => $names[0], '--remote' => true, '--apply' => true, '--force' => true])->expectsOutputToContain('exige --force-production')->assertExitCode(1);
        } finally {
            DB::purge('sqlite');
            @unlink($db);
            @unlink($dir.DIRECTORY_SEPARATOR.'.backup.lock');
            @rmdir($dir);
        }
    }

    public function test_remote_retention_uses_remote_inventory_and_preserves_unrelated_objects(): void
    {
        $names = [];
        for ($days = 0; $days < 56; $days++) {
            $names[] = $name = 'lumaflow-db-'.gmdate('Ymd', strtotime("-$days days")).'-030000-sqlite.sql.gz';
            $this->seedRemote($name);
        }
        $disk = Storage::disk('backup_s3');
        foreach (['database/notes.txt', 'other/'.$this->today(), 'database/nested/'.$this->today()] as $key) {
            $disk->put($key, 'untouched');
        }
        $service = app(RemoteBackupService::class);
        $this->assertCount(56, $service->listBackups());
        $dry = $service->prune(7, 4, true);
        $this->assertCount(11, $dry['kept']);
        $this->assertCount(56, $service->listBackups());
        $actual = $service->prune(7, 4);
        $this->assertSame($dry, $actual);
        $this->assertCount(11, $service->listBackups());
        $this->assertEqualsCanonicalizing(DataBackupService::selectForRetention($names, 7, 4), $actual['deleted']);
        foreach ($actual['deleted'] as $name) {
            $disk->assertMissing(['database/'.$name, 'database/'.$name.'.sha256']);
        }
        $disk->assertExists(['database/notes.txt', 'other/'.$this->today(), 'database/nested/'.$this->today()]);
    }

    public function test_missing_or_corrupted_remote_checksum_fails_and_is_never_ok(): void
    {
        $name = $this->today();
        $this->seedRemote($name);
        $disk = Storage::disk('backup_s3');
        $disk->delete('database/'.$name.'.sha256');
        $this->artisan('data:backup-status --remote')->expectsOutputToContain('FALLO')->assertExitCode(1);
        $this->artisan('data:restore', ['file' => $name, '--remote' => true])->assertExitCode(1);
        $disk->put('database/'.$name.'.sha256', str_repeat('0', 64).'  '.$name);
        $this->artisan('data:backup-status --remote')->expectsOutputToContain('FALLO')->assertExitCode(1);
        $disk->delete('database/'.$name.'.sha256');
        $this->assertContains($name, app(RemoteBackupService::class)->prune(7, 4)['deleted']);
    }

    public function test_status_reports_latest_timestamp_checksum_size_and_stale(): void
    {
        $this->artisan('data:backup-status --remote')->expectsOutputToContain('Sin backups remotos')->assertExitCode(1);
        $this->seedRemote('lumaflow-db-20200101-030000-sqlite.sql.gz');
        $this->artisan('data:backup-status --remote')->expectsOutputToContain('STALE')->assertExitCode(1);
        $name = $this->today();
        $dump = $this->seedRemote($name);
        $this->assertSame(0, Artisan::call('data:backup-status --remote'));
        $output = Artisan::output();
        foreach ([$name, 'Timestamp UTC', hash('sha256', $dump), 'OK'] as $value) {
            $this->assertStringContainsString($value, $output);
        }
    }

    public function test_remote_paths_are_strict_basenames(): void
    {
        foreach (['../'.$this->today(), 'database/'.$this->today(), '..\\'.$this->today(), '/'.$this->today(), 'notes.sql.gz'] as $name) {
            $this->assertFalse(RemoteBackupService::recognizedName($name));
            $this->artisan('data:restore', ['file' => $name, '--remote' => true])->assertExitCode(1);
        }
    }

    public function test_invalid_configuration_fails_before_dump_without_secret_output_or_logs(): void
    {
        $this->mock(DataBackupService::class, function ($mock) {
            $mock->shouldReceive('backupDirectory')->andReturn(sys_get_temp_dir());
            $mock->shouldNotReceive('backup');
        });
        config(['filesystems.disks.backup_s3.endpoint' => 'http://'.implode('-', self::CANARIES)]);
        $logs = '';
        Event::listen(MessageLogged::class, function ($event) use (&$logs) {
            $logs .= $event->message.(string) ($event->context['exception'] ?? '');
        });
        $this->assertSame(1, Artisan::call('data:backup --remote'));
        $output = Artisan::output();
        foreach (self::CANARIES as $canary) {
            $this->assertStringNotContainsString($canary, $output.$logs);
        }
        config(['filesystems.disks.backup_s3.key' => '']);
        $this->expectException(RuntimeException::class);
        app(RemoteBackupService::class)->assertConfigured();
    }

    public static function uploadFailures(): array
    {
        return ['dump upload fails' => [1], 'checksum upload fails' => [2]];
    }

    #[DataProvider('uploadFailures')]
    public function test_upload_failure_returns_nonzero_cleans_local_and_redacts_sdk_exception(int $failsAt): void
    {
        $name = $this->today();
        $file = sys_get_temp_dir().DIRECTORY_SEPARATOR.$name;
        $dump = gzencode('-- synthetic');
        file_put_contents($file, $dump);
        file_put_contents($file.'.sha256', hash('sha256', $dump).'  '.$name);
        $this->mock(DataBackupService::class, function ($mock) use ($file, $dump) {
            $mock->shouldReceive('backupDirectory')->andReturn(sys_get_temp_dir());
            $mock->shouldReceive('backup')->once()->andReturn(['file' => $file, 'bytes' => strlen($dump), 'sha256' => hash('sha256', $dump), 'driver' => 'sqlite']);
            $mock->shouldReceive('verifyChecksum')->andReturn(true);
        });
        $disk = \Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('exists')->twice()->andReturn(false);
        $calls = 0;
        $disk->shouldReceive('put')->times($failsAt)->andReturnUsing(function () use (&$calls, $failsAt) {
            if (++$calls === $failsAt) {
                throw new RuntimeException(implode(' ', self::CANARIES));
            }

            return true;
        });
        Storage::set('backup_s3', $disk);
        $logs = '';
        Event::listen(MessageLogged::class, function ($event) use (&$logs) {
            $logs .= $event->message.(string) ($event->context['exception'] ?? '');
        });
        $this->assertSame(1, Artisan::call('data:backup --remote --prune'));
        $output = Artisan::output();
        $this->assertStringNotContainsString('Backup remoto verificado', $output);
        foreach (self::CANARIES as $canary) {
            $this->assertStringNotContainsString($canary, $output.$logs);
        }
        $this->assertFileDoesNotExist($file);
        $this->assertFileDoesNotExist($file.'.sha256');
    }

    public function test_download_uses_private_temporary_directory_and_cleans_after_callback_failure(): void
    {
        $name = $this->today();
        $this->seedRemote($name);
        $temporary = '';
        try {
            app(RemoteBackupService::class)->withDownloaded($name, function ($file) use (&$temporary) {
                $temporary = $file;
                $this->assertFileExists($file);
                $this->assertTrue(app(DataBackupService::class)->verifyChecksum($file));
                throw new RuntimeException(self::CANARIES[1]);
            });
            $this->fail('Must fail without SDK secret text.');
        } catch (RuntimeException $exception) {
            $this->assertNull($exception->getPrevious());
            $this->assertStringNotContainsString(self::CANARIES[1], $exception->getMessage());
        }
        $this->assertFileDoesNotExist($temporary);
        $this->assertDirectoryDoesNotExist(dirname($temporary));
    }

    public static function purgeResults(): array
    {
        return ['success' => [false], 'partial deletion failure' => [true]];
    }

    #[DataProvider('purgeResults')]
    public function test_b2_prune_physically_deletes_versions_and_markers_across_pages(bool $fails): void
    {
        $current = 'database/'.$this->today();
        $old = 'database/lumaflow-db-20200101-030000-sqlite.sql.gz';
        $mock = new MockHandler([
            new Result(['Contents' => [['Key' => $current]], 'IsTruncated' => false]),
            new Result(['ContentLength' => 80]), // checksum exists (HeadObject)
            new Result(['Versions' => [
                ['Key' => $current, 'VersionId' => 'keep', 'IsLatest' => true],
                ['Key' => $current, 'VersionId' => 'noncurrent', 'IsLatest' => false],
                ['Key' => 'database/unrelated.txt', 'VersionId' => 'unrelated', 'IsLatest' => true],
            ], 'IsTruncated' => true, 'NextKeyMarker' => $old, 'NextVersionIdMarker' => 'next']),
            new Result(['Versions' => [
                ['Key' => $old, 'VersionId' => 'old', 'IsLatest' => true],
                ['Key' => $old.'.sha256', 'VersionId' => 'old-checksum', 'IsLatest' => true],
            ], 'DeleteMarkers' => [['Key' => $old, 'VersionId' => 'marker', 'IsLatest' => false]], 'IsTruncated' => false]),
            new Result(['Errors' => $fails ? [['Code' => 'AccessDenied', 'Message' => self::CANARIES[1]]] : []]),
        ]);
        $client = new S3Client([
            'version' => 'latest', 'region' => 'us-west-004', 'endpoint' => config('filesystems.disks.backup_s3.endpoint'),
            'credentials' => ['key' => self::CANARIES[0], 'secret' => self::CANARIES[1]],
            'handler' => $mock, 'use_path_style_endpoint' => true,
        ]);
        $adapter = new \League\Flysystem\AwsS3V3\AwsS3V3Adapter($client, 'synthetic-backups');
        Storage::set('backup_s3', new AwsS3V3Adapter(new Filesystem($adapter), $adapter, config('filesystems.disks.backup_s3'), $client));
        if ($fails) {
            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessage('Operacion de backup B2 fallida');
        }
        $result = app(RemoteBackupService::class)->prune(7, 4);
        $this->assertContains(basename($old), $result['deleted']);
        $command = $mock->getLastCommand();
        $this->assertSame('DeleteObjects', $command->getName());
        $this->assertEqualsCanonicalizing([
            ['Key' => $current, 'VersionId' => 'noncurrent'],
            ['Key' => $old, 'VersionId' => 'old'],
            ['Key' => $old.'.sha256', 'VersionId' => 'old-checksum'],
            ['Key' => $old, 'VersionId' => 'marker'],
        ], $command['Delete']['Objects']);
        $this->assertSame(0, count($mock));
    }
}
