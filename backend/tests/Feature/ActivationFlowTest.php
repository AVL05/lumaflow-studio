<?php

namespace Tests\Feature;

use App\Models\Delivery;
use App\Models\User;
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
        $session = $user->sessions()->create([
            'name' => 'Boda',
            'date' => now()->addDay()->toDateString(),
            'session_type' => 'wedding',
            'status' => 'confirmed',
        ]);
        Delivery::query()->create([
            'user_id' => $user->id,
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
