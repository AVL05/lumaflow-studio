<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use App\Models\WorkspaceMembership;
use App\Services\WorkspaceService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceMembershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_is_backfilled_as_membership(): void
    {
        $owner = User::factory()->create();

        $membership = WorkspaceMembership::query()
            ->where('workspace_id', $owner->refresh()->current_workspace_id)
            ->where('user_id', $owner->id)
            ->first();

        $this->assertNotNull($membership);
        $this->assertSame(WorkspaceMembership::ROLE_OWNER, $membership->role);
    }

    public function test_membership_is_unique_per_user_and_workspace(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        $this->expectException(QueryException::class);

        WorkspaceMembership::create([
            'workspace_id' => $workspaceId,
            'user_id' => $owner->id,
            'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);
    }

    public function test_admin_and_member_access_shared_client(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;
        $client = Client::create(['user_id' => $owner->id, 'name' => 'Compartido', 'status' => 'active']);

        foreach ([WorkspaceMembership::ROLE_ADMIN, WorkspaceMembership::ROLE_MEMBER] as $role) {
            $mate = User::factory()->create();
            WorkspaceMembership::create(['workspace_id' => $workspaceId, 'user_id' => $mate->id, 'role' => $role]);
            $mate->forceFill(['current_workspace_id' => $workspaceId])->saveQuietly();

            Sanctum::actingAs($mate);
            $this->getJson("/api/clients/{$client->id}")->assertOk();
        }
    }

    public function test_user_without_membership_receives_404(): void
    {
        $owner = User::factory()->create();
        $client = Client::create(['user_id' => $owner->id, 'name' => 'Privado', 'status' => 'active']);

        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/clients/{$client->id}")->assertNotFound();
        $this->getJson('/api/workspace/members')->assertOk();
    }

    public function test_removed_member_loses_access_immediately(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;
        $client = Client::create(['user_id' => $owner->id, 'name' => 'Compartido', 'status' => 'active']);

        $member = User::factory()->create();
        $membership = WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($member);
        $this->getJson("/api/clients/{$client->id}")->assertOk();

        app(WorkspaceService::class)->removeMembership($membership);

        // Con el mismo token previo el acceso ya no existe.
        $this->getJson("/api/clients/{$client->id}")->assertNotFound();
    }

    public function test_removal_repairs_current_workspace(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        $member = User::factory()->create();
        $personalId = (int) $member->refresh()->current_workspace_id;
        $membership = WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);
        $member->forceFill(['current_workspace_id' => $workspaceId])->saveQuietly();

        app(WorkspaceService::class)->removeMembership($membership);

        $this->assertSame($personalId, (int) $member->refresh()->current_workspace_id);
    }

    public function test_member_can_create_resources_in_current_workspace(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);
        $member->forceFill(['current_workspace_id' => $workspaceId])->saveQuietly();

        Sanctum::actingAs($member);

        $created = $this->postJson('/api/clients', ['name' => 'Alta del miembro', 'status' => 'active'])
            ->assertCreated()->json('data');

        $stored = Client::query()->find($created['id']);

        $this->assertSame($workspaceId, (int) $stored->workspace_id);
        $this->assertSame($member->id, (int) $stored->user_id);

        Sanctum::actingAs($owner);
        $this->getJson("/api/clients/{$stored->id}")->assertOk();
    }

    public function test_owner_can_remove_member_and_admin(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        foreach ([WorkspaceMembership::ROLE_ADMIN, WorkspaceMembership::ROLE_MEMBER] as $role) {
            $mate = User::factory()->create();
            WorkspaceMembership::create(['workspace_id' => $workspaceId, 'user_id' => $mate->id, 'role' => $role]);

            $this->deleteJson("/api/workspace/members/{$mate->id}")->assertNoContent();
            $this->assertNull(WorkspaceMembership::query()
                ->where('workspace_id', $workspaceId)->where('user_id', $mate->id)->first());
        }
    }

    public function test_admin_can_remove_member_but_not_owner(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        $admin = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $admin->id, 'role' => WorkspaceMembership::ROLE_ADMIN,
        ]);

        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($admin);
        $this->putJson('/api/workspace/current', ['workspace_id' => $workspaceId])->assertOk();

        $this->deleteJson("/api/workspace/members/{$member->id}")->assertNoContent();
        $this->deleteJson("/api/workspace/members/{$owner->id}")->assertForbidden();
    }

    public function test_member_cannot_remove_anyone(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        $other = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $other->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($member);
        $this->putJson('/api/workspace/current', ['workspace_id' => $workspaceId])->assertOk();

        $this->deleteJson("/api/workspace/members/{$other->id}")->assertForbidden();
        $this->deleteJson("/api/workspace/members/{$owner->id}")->assertForbidden();
    }

    public function test_nobody_can_administer_foreign_workspace(): void
    {
        $ownerA = User::factory()->create();
        $ownerB = User::factory()->create();
        $clientB = Client::create(['user_id' => $ownerB->id, 'name' => 'Otro estudio', 'status' => 'active']);

        Sanctum::actingAs($ownerA);

        $this->getJson("/api/clients/{$clientB->id}")->assertNotFound();
        $this->deleteJson("/api/workspace/members/{$ownerB->id}")->assertNotFound();
    }

    public function test_members_index_hides_foreign_workspace(): void
    {
        $owner = User::factory()->create();

        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/workspace/members')->assertOk()->json();
        $ids = collect($response['data'])->pluck('user_id')->all();

        $this->assertNotContains($owner->id, $ids);
    }

    public function test_current_workspace_switches_only_between_memberships(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($member);
        $this->putJson('/api/workspace/current', ['workspace_id' => $workspaceId])
            ->assertOk()->assertJsonPath('data.role', WorkspaceMembership::ROLE_MEMBER);
        $this->assertSame($workspaceId, (int) $member->refresh()->current_workspace_id);

        $foreign = User::factory()->create();
        Sanctum::actingAs($foreign);
        $this->putJson('/api/workspace/current', ['workspace_id' => $workspaceId])->assertNotFound();
        $this->putJson('/api/workspace/current', ['workspace_id' => 999999])->assertUnprocessable();
    }
}
