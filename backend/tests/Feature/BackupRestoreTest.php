<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use App\Services\DataBackupService;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BackupRestoreTest extends TestCase
{
    private string $tmpDb;

    private string $backupFile = '';

    /** @var string[] */
    private array $preExisting = [];

    protected function setUp(): void
    {
        parent::setUp();

        $service = app(DataBackupService::class);
        $this->preExisting = $service->listBackups();

        // Drill real sobre archivo SQLite temporal, nunca :memory: ni produccion.
        $this->tmpDb = tempnam(sys_get_temp_dir(), 'lumaflow-drill-').'.sqlite';
        @unlink($this->tmpDb);
        touch($this->tmpDb);

        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => $this->tmpDb]);
        // Password canario: ningun output del backup puede contenerlo.
        config(['database.connections.mysql.password' => 's3cr3t-canario']);

        $this->artisan('migrate:fresh', ['--force' => true]);
    }

    protected function tearDown(): void
    {
        $service = app(DataBackupService::class);

        foreach (array_diff($service->listBackups(), $this->preExisting) as $name) {
            @unlink($service->backupDirectory().DIRECTORY_SEPARATOR.$name);
            @unlink($service->backupDirectory().DIRECTORY_SEPARATOR.$name.'.sha256');
        }

        DB::purge('sqlite');
        @unlink($this->tmpDb);

        parent::tearDown();
    }

    private function newestBackup(): string
    {
        $service = app(DataBackupService::class);
        $fresh = array_values(array_diff($service->listBackups(), $this->preExisting));

        $this->assertNotEmpty($fresh, 'El backup deberia haber creado un archivo nuevo.');

        rsort($fresh);

        return $service->backupDirectory().DIRECTORY_SEPARATOR.$fresh[0];
    }

    public function test_backup_restore_drill_with_synthetic_data(): void
    {
        $user = User::factory()->create(['name' => 'Sintético']);
        Client::create(['user_id' => $user->id, 'name' => 'Cliente Sintético', 'status' => 'active']);

        $this->artisan('data:backup')
            ->doesntExpectOutputToContain('s3cr3t-canario')
            ->assertExitCode(0);

        $service = app(DataBackupService::class);
        $this->backupFile = $this->newestBackup();

        // Destruir y recrear vacio.
        DB::purge('sqlite');
        @unlink($this->tmpDb);
        touch($this->tmpDb);

        // Drill (sin --apply): verifica en destino temporal aislado.
        $this->artisan('data:restore', ['file' => basename($this->backupFile)])
            ->assertExitCode(0);

        // Apply real sobre el archivo temporal y verificacion de registros.
        $this->artisan('data:restore', ['file' => basename($this->backupFile), '--apply' => true, '--force' => true])
            ->assertExitCode(0);

        $this->assertDatabaseHas('users', ['name' => 'Sintético']);
        $this->assertDatabaseHas('clients', ['name' => 'Cliente Sintético']);
    }

    public function test_restore_is_blocked_in_production_without_flag(): void
    {
        $user = User::factory()->create();
        Client::create(['user_id' => $user->id, 'name' => 'X', 'status' => 'active']);
        $this->artisan('data:backup')->assertExitCode(0);
        $this->backupFile = $this->newestBackup();
        $this->assertNotSame('', $this->backupFile);

        $this->app['env'] = 'production';

        $this->artisan('data:restore', [
            'file' => basename($this->backupFile), '--apply' => true, '--force' => true,
        ])->assertExitCode(1);
    }

    public function test_backup_fails_clearly_without_binary_or_config(): void
    {
        config(['database.default' => 'mysql']);

        $command = $this->artisan('data:backup')
            ->doesntExpectOutputToContain('s3cr3t-canario');

        if (! DataBackupService::binaryAvailable('mysqldump')) {
            $command->expectsOutputToContain('mysqldump');
        }

        $command->assertExitCode(1);
    }
}
