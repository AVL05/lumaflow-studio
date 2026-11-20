<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    private function addMember(User $owner, User $member): int
    {
        $workspaceId = (int) $owner->refresh()->current_workspace_id;
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        return $workspaceId;
    }

    private function clientFor(User $user, string $name, ?int $workspaceId = null): Client
    {
        return Client::create([
            'user_id' => $user->id,
            'workspace_id' => $workspaceId ?? $user->refresh()->current_workspace_id,
            'name' => $name,
            'status' => 'active',
        ]);
    }

    public function test_requires_authentication(): void
    {
        $this->postJson('/api/account/deletion', ['password' => 'x'])->assertUnauthorized();
        $this->deleteJson('/api/account/deletion')->assertUnauthorized();
    }

    public function test_wrong_password_does_not_schedule_anything(): void
    {
        $user = User::factory()->create(['password' => 'clave-correcta-1']);
        Sanctum::actingAs($user);

        $this->postJson('/api/account/deletion', ['password' => 'incorrecta'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertNull($user->fresh()->deletion_scheduled_for);
    }

    public function test_request_schedules_deletion_after_the_grace_period_and_keeps_the_account_usable(): void
    {
        config(['account.deletion_grace_days' => 30]);
        $user = User::factory()->create(['password' => 'clave-correcta-1']);
        Sanctum::actingAs($user);

        $this->postJson('/api/account/deletion', ['password' => 'clave-correcta-1'])
            ->assertStatus(202)
            ->assertJsonPath('grace_days', 30);

        $fresh = $user->fresh();
        $this->assertNotNull($fresh->deletion_requested_at);
        $this->assertTrue($fresh->deletion_scheduled_for->isSameDay(now()->addDays(30)));

        $this->getJson('/api/user')->assertOk()->assertJsonPath('data.deletion_scheduled_for', $fresh->deletion_scheduled_for->toISOString());
        $this->assertTrue(User::query()->whereKey($user->id)->exists());
    }

    public function test_cancel_clears_the_schedule(): void
    {
        $user = User::factory()->create(['password' => 'clave-correcta-1']);
        Sanctum::actingAs($user);
        $this->postJson('/api/account/deletion', ['password' => 'clave-correcta-1'])->assertStatus(202);

        $this->deleteJson('/api/account/deletion')->assertOk();

        $fresh = $user->fresh();
        $this->assertNull($fresh->deletion_requested_at);
        $this->assertNull($fresh->deletion_scheduled_for);
    }

    public function test_owner_with_other_members_cannot_request_deletion(): void
    {
        $owner = User::factory()->create(['password' => 'clave-correcta-1']);
        $this->addMember($owner, User::factory()->create());
        Sanctum::actingAs($owner);

        $this->postJson('/api/account/deletion', ['password' => 'clave-correcta-1'])
            ->assertStatus(409)
            ->assertJsonStructure(['message', 'workspaces']);

        $this->assertNull($owner->fresh()->deletion_scheduled_for);
    }

    public function test_purge_only_touches_accounts_whose_grace_period_has_expired(): void
    {
        $pending = User::factory()->create(['deletion_scheduled_for' => now()->addDays(5)]);
        $due = User::factory()->create(['deletion_scheduled_for' => now()->subMinute()]);
        $untouched = User::factory()->create();

        $this->artisan('account:purge-deleted')->assertSuccessful();

        $this->assertTrue(User::query()->whereKey($pending->id)->exists());
        $this->assertTrue(User::query()->whereKey($untouched->id)->exists());
        $this->assertFalse(User::query()->whereKey($due->id)->exists());
    }

    public function test_dry_run_deletes_nothing(): void
    {
        $due = User::factory()->create(['deletion_scheduled_for' => now()->subDay()]);

        $this->artisan('account:purge-deleted --dry-run')->expectsOutputToContain('dry-run')->assertSuccessful();

        $this->assertTrue(User::query()->whereKey($due->id)->exists());
    }

    public function test_purge_removes_the_account_its_workspace_and_data_but_never_other_studios_data(): void
    {
        $leaving = User::factory()->create(['deletion_scheduled_for' => now()->subDay()]);
        $other = User::factory()->create();
        $mine = $this->clientFor($leaving, 'Cliente que se va');
        $theirs = $this->clientFor($other, 'Cliente de otro estudio');
        $leavingWorkspace = (int) $leaving->current_workspace_id;

        $this->artisan('account:purge-deleted')->assertSuccessful();

        $this->assertFalse(User::query()->whereKey($leaving->id)->exists());
        $this->assertFalse(Workspace::query()->whereKey($leavingWorkspace)->exists());
        $this->assertNull(Client::query()->whereKey($mine->id)->first());
        $this->assertNotNull(Client::query()->whereKey($theirs->id)->first());
        $this->assertTrue(User::query()->whereKey($other->id)->exists());
    }

    public function test_records_a_member_created_in_someone_elses_studio_stay_with_that_studio(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create(['deletion_scheduled_for' => now()->subDay()]);
        $workspaceId = $this->addMember($owner, $member);
        $shared = $this->clientFor($member, 'Cliente compartido', $workspaceId);
        $personal = $this->clientFor($member, 'Cliente personal del miembro');

        $this->artisan('account:purge-deleted')->assertSuccessful();

        $this->assertFalse(User::query()->whereKey($member->id)->exists());
        $kept = Client::query()->whereKey($shared->id)->first();
        $this->assertNotNull($kept, 'el cliente del estudio compartido no debe borrarse');
        $this->assertSame($owner->id, $kept->user_id);
        $this->assertSame($workspaceId, (int) $kept->workspace_id);
        $this->assertNull(Client::query()->whereKey($personal->id)->first());
        $this->assertFalse(WorkspaceMembership::query()->where('user_id', $member->id)->exists());
    }

    public function test_purge_is_skipped_when_the_studio_gained_members_after_the_request(): void
    {
        $owner = User::factory()->create(['deletion_scheduled_for' => now()->subDay()]);
        $this->addMember($owner, User::factory()->create());

        $this->artisan('account:purge-deleted')->assertFailed();

        $this->assertTrue(User::query()->whereKey($owner->id)->exists());
    }
}
