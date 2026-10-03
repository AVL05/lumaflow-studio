<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\Job;
use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceInvitationTest extends TestCase
{
    use RefreshDatabase;

    private function invite(User $inviter, string $email, string $role = WorkspaceMembership::ROLE_MEMBER): array
    {
        Sanctum::actingAs($inviter);

        return $this->postJson('/api/workspace/invitations', ['email' => $email, 'role' => $role])
            ->assertCreated()->json();
    }

    public function test_owner_can_invite_and_admin_can_invite_member(): void
    {
        $owner = User::factory()->create();

        $this->invite($owner, 'nuevo@lumaflow.test', WorkspaceMembership::ROLE_ADMIN);

        $admin = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $owner->refresh()->current_workspace_id,
            'user_id' => $admin->id,
            'role' => WorkspaceMembership::ROLE_ADMIN,
        ]);

        $this->invite($admin, 'otro@lumaflow.test', WorkspaceMembership::ROLE_MEMBER);
    }

    public function test_member_cannot_invite_and_admin_cannot_invite_admin(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($member);
        $this->putJson('/api/workspace/current', ['workspace_id' => $workspaceId])->assertOk();
        $this->postJson('/api/workspace/invitations', ['email' => 'x@lumaflow.test', 'role' => 'member'])
            ->assertForbidden();

        $admin = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $admin->id, 'role' => WorkspaceMembership::ROLE_ADMIN,
        ]);

        Sanctum::actingAs($admin);
        $this->putJson('/api/workspace/current', ['workspace_id' => $workspaceId])->assertOk();
        $this->postJson('/api/workspace/invitations', ['email' => 'y@lumaflow.test', 'role' => 'admin'])
            ->assertForbidden();
        $this->postJson('/api/workspace/invitations', ['email' => 'no-email', 'role' => 'member'])
            ->assertUnprocessable();
    }

    public function test_invitation_token_is_random_and_hashed(): void
    {
        $owner = User::factory()->create();

        $first = $this->invite($owner, 'uno@lumaflow.test');
        $second = $this->invite($owner, 'dos@lumaflow.test');

        $this->assertNotSame($first['meta']['token'], $second['meta']['token']);
        $this->assertSame(64, strlen($first['meta']['token']));

        $stored = WorkspaceInvitation::query()->where('email', 'uno@lumaflow.test')->first();

        $this->assertNotSame($first['meta']['token'], $stored->token_hash);
        $this->assertSame(hash('sha256', $first['meta']['token']), $stored->token_hash);
    }

    public function test_valid_token_accepts_and_creates_membership_once(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;
        $payload = $this->invite($owner, 'invitado@lumaflow.test');

        $guest = User::factory()->create(['email' => 'invitado@lumaflow.test']);
        Sanctum::actingAs($guest);

        $this->postJson('/api/workspace/invitations/accept', ['token' => $payload['meta']['token']])
            ->assertCreated();

        $this->assertSame(WorkspaceMembership::ROLE_MEMBER, $guest->refresh()->memberships()
            ->where('workspace_id', $workspaceId)->value('role'));

        // Reutilizar el token queda bloqueado y no duplica.
        $this->postJson('/api/workspace/invitations/accept', ['token' => $payload['meta']['token']])
            ->assertUnprocessable();

        $this->assertSame(1, WorkspaceMembership::query()
            ->where('workspace_id', $workspaceId)->where('user_id', $guest->id)->count());
    }

    public function test_wrong_email_cannot_accept(): void
    {
        $owner = User::factory()->create();
        $payload = $this->invite($owner, 'destinatario@lumaflow.test');

        Sanctum::actingAs(User::factory()->create(['email' => 'intruso@lumaflow.test']));

        $this->postJson('/api/workspace/invitations/accept', ['token' => $payload['meta']['token']])
            ->assertForbidden();
    }

    public function test_expired_and_revoked_invitations_block(): void
    {
        $owner = User::factory()->create();

        $expired = $this->invite($owner, 'caducado@lumaflow.test');
        WorkspaceInvitation::query()->where('email', 'caducado@lumaflow.test')
            ->update(['expires_at' => now()->subDay(), 'token_hash' => hash('sha256', 'token-caducado-seguro-0123456789abcdef')]);

        $guest = User::factory()->create(['email' => 'caducado@lumaflow.test']);
        Sanctum::actingAs($guest);
        $this->postJson('/api/workspace/invitations/accept', ['token' => 'token-caducado-seguro-0123456789abcdef'])
            ->assertUnprocessable();

        $revoked = $this->invite($owner, 'revocado@lumaflow.test');
        Sanctum::actingAs($owner);
        $invitationId = $revoked['data']['id'];
        $this->deleteJson("/api/workspace/invitations/{$invitationId}")->assertNoContent();

        $guest2 = User::factory()->create(['email' => 'revocado@lumaflow.test']);
        Sanctum::actingAs($guest2);
        $this->postJson('/api/workspace/invitations/accept', ['token' => $revoked['meta']['token']])
            ->assertUnprocessable();
    }

    public function test_existing_membership_is_not_duplicated_on_accept(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;
        $payload = $this->invite($owner, 'repetido@lumaflow.test');

        $guest = User::factory()->create(['email' => 'repetido@lumaflow.test']);
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $guest->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($guest);
        $this->postJson('/api/workspace/invitations/accept', ['token' => $payload['meta']['token']])
            ->assertCreated();

        $this->assertSame(1, WorkspaceMembership::query()
            ->where('workspace_id', $workspaceId)->where('user_id', $guest->id)->count());
    }

    public function test_member_accesses_job_and_delivery_of_the_workspace(): void
    {
        $owner = User::factory()->create();
        $workspaceId = (int) $owner->refresh()->current_workspace_id;

        $client = Client::create(['user_id' => $owner->id, 'workspace_id' => $workspaceId, 'name' => 'Novios', 'status' => 'active']);
        $job = Job::create([
            'user_id' => $owner->id, 'workspace_id' => $workspaceId, 'client_id' => $client->id,
            'title' => 'Boda', 'specialty' => 'general', 'workflow_key' => 'general',
            'status' => 'lead', 'contract_status' => 'not_required',
        ]);
        $delivery = Delivery::create([
            'user_id' => $owner->id, 'workspace_id' => $workspaceId, 'client_id' => $client->id,
            'job_id' => $job->id, 'title' => 'Galeria', 'status' => 'pending',
            'payment_status' => 'unpaid', 'gallery_url' => 'https://example.com/g',
        ]);

        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($member);
        $this->getJson("/api/clients/{$client->id}")->assertOk();
        $this->getJson("/api/jobs/{$job->id}")->assertOk();
        $this->getJson("/api/deliveries/{$delivery->id}")->assertOk();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/clients/{$client->id}")->assertNotFound();
        $this->getJson("/api/jobs/{$job->id}")->assertNotFound();
        $this->getJson("/api/deliveries/{$delivery->id}")->assertNotFound();
    }

    public function test_unknown_token_does_not_leak_existence(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/workspace/invitations/accept', ['token' => str_repeat('a', 64)])
            ->assertNotFound();
    }
}
