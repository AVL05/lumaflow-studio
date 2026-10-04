<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\User;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_choose_first_job_after_onboarding(): void
    {
        $user = User::factory()->withoutGettingStarted()->create();

        $this->actingAs($user)
            ->postJson('/api/getting-started', ['choice' => 'create_first_job'])
            ->assertOk()
            ->assertJsonPath('data.getting_started_choice', 'create_first_job')
            ->assertJsonPath('data.getting_started_completed', true);
    }

    public function test_sample_workspace_is_optional_and_idempotent(): void
    {
        $user = User::factory()->withoutGettingStarted()->create();

        $this->actingAs($user)->postJson('/api/getting-started', ['choice' => 'sample_workspace'])->assertOk();
        $this->actingAs($user)->postJson('/api/activation/sample-workspace')->assertOk();

        $this->assertSame(2, $user->clients()->count());
        $this->assertSame(2, $user->sessions()->count());
        $this->assertSame(1, $user->deliveries()->count());
        $this->assertSame(2, $user->tasks()->count());
        $this->assertNotNull($user->refresh()->sample_workspace_activated_at);
    }

    public function test_client_import_skips_existing_emails(): void
    {
        $user = User::factory()->create();
        $user->clients()->create(['name' => 'Ana', 'email' => 'ana@example.com', 'status' => 'active']);

        $this->actingAs($user)
            ->postJson('/api/clients/import', [
                'clients' => [
                    ['name' => 'Ana repetida', 'email' => 'ANA@example.com'],
                    ['name' => 'Bruno', 'email' => 'bruno@example.com', 'company' => 'Luz Norte'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.imported', 1)
            ->assertJsonPath('data.skipped', 1);

        $this->assertDatabaseHas('clients', ['user_id' => $user->id, 'name' => 'Bruno']);
    }

    public function test_dashboard_reports_real_activation_and_operational_milestone(): void
    {
        $user = User::factory()->withoutGettingStarted()->create();
        $client = $user->clients()->create(['name' => 'Ana', 'status' => 'active']);
        $job = $user->jobs()->create([
            'client_id' => $client->id,
            'title' => 'Boda Ana',
            'specialty' => 'general',
            'workflow_key' => 'general',
            'status' => 'lead',
            'contract_status' => 'not_required',
        ]);
        $session = $user->sessions()->create([
            'job_id' => $job->id,
            'name' => 'Boda',
            'date' => now()->addDay()->toDateString(),
            'session_type' => 'wedding',
            'status' => 'confirmed',
        ]);
        Delivery::query()->create([
            'user_id' => $user->id,
            'workspace_id' => $user->current_workspace_id,
            'client_id' => $client->id,
            'session_id' => $session->id,
            'title' => 'Boda completa',
            'status' => 'delivered',
        ]);

        $this->actingAs($user)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.activation.completed', 4)
            ->assertJsonPath('data.activation.total', 5)
            ->assertJsonPath('data.activation.operational', true)
            ->assertJsonPath('data.activation.operational_milestone', 'completed_work');
    }

    public function test_delivery_without_job_does_not_complete_job_step(): void
    {
        $user = User::factory()->withoutGettingStarted()->create();
        $client = $user->clients()->create(['name' => 'Ana', 'status' => 'active']);
        $session = $user->sessions()->create([
            'name' => 'Boda',
            'date' => now()->addDay()->toDateString(),
            'session_type' => 'wedding',
            'status' => 'confirmed',
        ]);
        Delivery::query()->create([
            'user_id' => $user->id,
            'workspace_id' => $user->current_workspace_id,
            'client_id' => $client->id,
            'session_id' => $session->id,
            'title' => 'Solo entrega',
            'status' => 'pending',
        ]);

        $steps = $this->actingAs($user)->getJson('/api/dashboard')->assertOk()->json('data.activation.steps');
        $byKey = collect($steps)->keyBy('key');

        $this->assertTrue($byKey['client']['completed']);
        $this->assertTrue($byKey['session']['completed']);
        $this->assertFalse($byKey['job']['completed']);
    }

    public function test_demo_data_never_counts_as_activation(): void
    {
        $user = User::factory()->withoutGettingStarted()->create();

        $this->actingAs($user)->postJson('/api/getting-started', ['choice' => 'sample_workspace'])->assertOk();

        $steps = $this->actingAs($user)->getJson('/api/dashboard')->assertOk()->json('data.activation.steps');
        $byKey = collect($steps)->keyBy('key');

        $this->assertTrue($byKey['studio']['completed']);
        $this->assertFalse($byKey['client']['completed']);
        $this->assertFalse($byKey['job']['completed']);
        $this->assertFalse($byKey['session']['completed']);
        $this->assertTrue($user->clients()->where('is_demo', true)->exists());
    }

    public function test_activation_reflects_shared_workspace_progress(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $owner->refresh()->current_workspace_id,
            'user_id' => $member->id,
            'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);
        $owner->clients()->create(['name' => 'Compartido', 'status' => 'active']);

        $steps = $this->actingAs($member)->getJson('/api/dashboard')->assertOk()->json('data.activation.steps');
        $byKey = collect($steps)->keyBy('key');

        $this->assertTrue($byKey['client']['completed']);
        $this->assertFalse($byKey['job']['completed']);
    }

    public function test_later_choice_marks_getting_started_without_side_effects(): void
    {
        $user = User::factory()->withoutGettingStarted()->create();

        $this->actingAs($user)
            ->postJson('/api/getting-started', ['choice' => 'later'])
            ->assertOk()
            ->assertJsonPath('data.getting_started_choice', 'later')
            ->assertJsonPath('data.getting_started_completed', true);

        $this->assertSame(0, $user->clients()->count());
    }

    public function test_public_booking_is_available_only_after_activation(): void
    {
        $user = User::factory()->withoutGettingStarted()->create();

        $this->getJson("/api/public/studios/{$user->studio_slug}")->assertNotFound();

        $this->actingAs($user)
            ->postJson('/api/activation/bookings')
            ->assertOk()
            ->assertJsonPath('data.operational', true)
            ->assertJsonPath('data.operational_milestone', 'booking_link');

        $this->getJson("/api/public/studios/{$user->studio_slug}")->assertOk();
    }
}
