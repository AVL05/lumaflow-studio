<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Job;
use App\Models\Location;
use App\Models\ProjectTemplate;
use App\Models\Session;
use App\Models\Shot;
use App\Models\User;
use App\Services\DataBackupService;
use App\Services\DeliveryRevisionService;
use App\Services\JobWorkflowService;
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
        $project = Job::create(['user_id' => $user->id, 'title' => 'Synthetic personal project', 'project_type' => 'personal', 'briefing' => ['objectives' => 'Synthetic recovery objective'], 'briefing_revision' => 1]);
        $location = Location::create(['user_id' => $user->id, 'name' => 'Synthetic recovery location', 'latitude' => 0, 'longitude' => 0, 'type' => 'urban']);
        $project->locations()->attach($location);
        $day = Session::create(['user_id' => $user->id, 'job_id' => $project->id, 'name' => 'Synthetic recovery day', 'date' => '2030-01-01', 'time' => '09:00', 'end_time' => '18:00', 'participants' => [['name' => 'Synthetic crew']], 'session_type' => 'other', 'status' => 'planned']);
        $gear = GearItem::create(['user_id' => $user->id, 'name' => 'Synthetic recovery gear', 'category' => 'camera', 'condition' => 'active']);
        $shot = Shot::create(['user_id' => $user->id, 'workspace_id' => $project->workspace_id, 'job_id' => $project->id, 'session_id' => $day->id, 'location_id' => $location->id, 'description' => 'Synthetic recovery shot', 'status' => 'ready', 'notes' => 'Synthetic notes', 'revision' => 2]);
        $shot->gearItems()->attach($gear);
        $template = ProjectTemplate::create(['user_id' => $user->id, 'workspace_id' => $project->workspace_id, 'name' => 'Synthetic recovery template', 'definition' => config('project_templates.portrait.definition')]);
        $workflows = app(JobWorkflowService::class);
        $recipe = $workflows->template($project, 'custom-'.$template->id);
        $workflows->applyTemplate($user, $project, $recipe['key'], $workflows->preview($project, $recipe)['hash']);
        $project->stages()->first()->update(['assigned_user_id' => $user->id, 'due_date' => '2030-05-01', 'notes' => 'Synthetic stage recovery notes']);
        $project->stages()->first()->tasks()->first()->update(['assigned_user_id' => $user->id, 'due_date' => '2030-04-30']);
        $delivery = Delivery::create(['user_id' => $user->id, 'job_id' => $project->id, 'title' => 'Synthetic recovery delivery', 'status' => 'delivered', 'gallery_url' => 'https://example.com/synthetic-v1']);
        app(DeliveryRevisionService::class)->publish($delivery, $user, ['version' => 0, 'request_id' => '00000000-0000-4000-8000-000000000003', 'gallery_url' => 'https://example.com/synthetic-v2', 'notes' => 'Synthetic recovery revision']);
        app(DeliveryRevisionService::class)->portal($delivery->fresh(), $user, ['version' => 1, 'action' => 'revoke']);

        $this->artisan('data:backup', ['--prune' => true])
            ->doesntExpectOutputToContain('s3cr3t-canario')
            ->assertExitCode(0);

        $service = app(DataBackupService::class);
        $this->backupFile = $this->newestBackup();
        $this->assertGreaterThan(0, filesize($this->backupFile));
        $this->assertTrue($service->verifyChecksum($this->backupFile));

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
        $restored = Job::findOrFail($project->id);
        $this->assertSame('personal', $restored->project_type);
        $this->assertNull($restored->client_id);
        $this->assertSame(['objectives' => 'Synthetic recovery objective'], $restored->briefing);
        $this->assertSame(1, $restored->briefing_revision);
        $this->assertSame([$location->id], $restored->locations->modelKeys());
        $restoredShot = Shot::findOrFail($shot->id);
        $this->assertSame('ready', $restoredShot->status);
        $this->assertSame('Synthetic notes', $restoredShot->notes);
        $this->assertSame(2, $restoredShot->revision);
        $this->assertSame([$gear->id], $restoredShot->gearItems->modelKeys());
        $this->assertSame($day->id, $restoredShot->session_id);
        $this->assertSame('18:00', substr($restoredShot->session->end_time, 0, 5));
        $this->assertSame([['name' => 'Synthetic crew']], $restoredShot->session->participants);
        $this->assertSame(8, $restored->stages()->count());
        $this->assertSame($user->id, $restored->stages()->first()->assigned_user_id);
        $this->assertSame('2030-05-01', $restored->stages()->first()->due_date->toDateString());
        $this->assertSame('Synthetic stage recovery notes', $restored->stages()->first()->notes);
        $this->assertSame($user->id, $restored->stages()->first()->tasks()->first()->assigned_user_id);
        $this->assertSame(12, $restored->tasks()->count());
        $this->assertSame(9, $restored->checklists()->count());
        $this->assertSame(8, count(ProjectTemplate::findOrFail($template->id)->definition['stages']));
        $this->assertDatabaseHas('project_template_applications', ['job_id' => $restored->id, 'template_key' => 'custom-'.$template->id]);
        $restoredDelivery = Delivery::findOrFail($delivery->id);
        $this->assertNull($restoredDelivery->client_id);
        $this->assertSame($delivery->public_token, $restoredDelivery->public_token);
        $this->assertSame(2, $restoredDelivery->revision_number);
        $this->assertNotNull($restoredDelivery->portal_revoked_at);
        $this->assertSame('https://example.com/synthetic-v1', $restoredDelivery->revisions()->where('number', 1)->first()->gallery_url);
        $this->assertSame('Synthetic recovery revision', $restoredDelivery->revisions()->where('number', 2)->first()->notes);
        $this->assertSame(2, $restoredDelivery->activities()->count());
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

        $command->expectsOutputToContain('Backup fallido');
        $command->assertExitCode(1);
    }
}
