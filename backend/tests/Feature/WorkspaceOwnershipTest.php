<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Job;
use App\Models\User;
use App\Models\Workspace;
use App\Services\WorkspaceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_user_automatically_receives_a_personal_workspace(): void
    {
        $user = User::factory()->create();
        $user->refresh();

        $this->assertNotNull($user->current_workspace_id);

        $workspace = Workspace::query()->find($user->current_workspace_id);

        $this->assertNotNull($workspace);
        $this->assertSame($user->id, $workspace->user_id);
        $this->assertNotEmpty($workspace->slug);
    }

    public function test_workspace_slugs_stay_unique_across_users(): void
    {
        $first = User::factory()->create(['name' => 'Estudio Comun']);
        $second = User::factory()->create(['name' => 'Estudio Comun']);

        $this->assertNotSame(
            $first->refresh()->currentWorkspace->slug,
            $second->refresh()->currentWorkspace->slug
        );
    }

    public function test_legacy_user_without_workspace_is_backfilled(): void
    {
        $user = User::factory()->create();

        // Simula una cuenta anterior a la migracion: sin workspace ni puntero.
        Workspace::query()->where('user_id', $user->id)->delete();
        User::query()->whereKey($user->id)->update(['current_workspace_id' => null]);

        $recovered = app(WorkspaceService::class)->ensureForUser($user->refresh());

        $this->assertNotNull($recovered->getKey());
        $this->assertSame($recovered->getKey(), (int) $user->refresh()->current_workspace_id);
        $this->assertSame($user->id, $recovered->user_id);

        // Idempotente: una segunda llamada no duplica.
        app(WorkspaceService::class)->ensureForUser($user->refresh());

        $this->assertSame(1, Workspace::query()->where('user_id', $user->id)->count());
    }

    public function test_created_resources_carry_the_owner_workspace(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $client = $this->postJson('/api/clients', [
            'name' => 'Cliente Estudio',
            'status' => 'active',
        ])->assertCreated()->json('data');

        $stored = Client::query()->find($client['id']);

        $this->assertNotNull($stored);
        $this->assertSame($user->id, $stored->user_id);
        $this->assertSame((int) $user->refresh()->current_workspace_id, (int) $stored->workspace_id);
    }

    public function test_owner_can_access_own_resources(): void
    {
        $user = User::factory()->create();
        $client = Client::create(['user_id' => $user->id, 'name' => 'Propio', 'status' => 'active']);
        Sanctum::actingAs($user);

        $this->getJson("/api/clients/{$client->id}")->assertOk();
        $this->assertSame((int) $user->refresh()->current_workspace_id, (int) $client->refresh()->workspace_id);
    }

    public function test_foreign_workspace_resources_resolve_to_404(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $foreignClient = Client::create(['user_id' => $owner->id, 'name' => 'Ajeno', 'status' => 'active']);

        $this->assertNotSame(
            (int) $owner->refresh()->current_workspace_id,
            (int) $outsider->refresh()->current_workspace_id
        );

        Sanctum::actingAs($outsider);

        $this->getJson("/api/clients/{$foreignClient->id}")->assertNotFound();
        $this->putJson("/api/clients/{$foreignClient->id}", ['name' => 'Intento', 'status' => 'active'])->assertNotFound();
        $this->deleteJson("/api/clients/{$foreignClient->id}")->assertNotFound();
    }

    public function test_relations_keep_data_with_workspace_assigned(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $client = Client::create(['user_id' => $user->id, 'name' => 'Novios', 'status' => 'active']);

        $job = $this->postJson('/api/jobs', [
            'client_id' => $client->id,
            'title' => 'Boda Jardin',
            'specialty' => 'general',
            'workflow_key' => 'general',
            'status' => 'lead',
            'contract_status' => 'not_required',
        ])->assertCreated()->json('data');

        $stored = Job::query()->find($job['id']);

        $this->assertNotNull($stored);
        $this->assertSame($client->id, $stored->client_id);
        $this->assertSame($client->workspace_id, $stored->workspace_id);
        $this->assertSame('Novios', $stored->client->name);
    }
}
