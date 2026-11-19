<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicEndpointAbuseTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $extra = []): array
    {
        return ['name' => 'Lead', 'email' => 'lead@example.com'] + $extra;
    }

    public function test_filled_honeypot_looks_successful_but_stores_nothing(): void
    {
        $user = User::factory()->create();

        $this->postJson("/api/public/studios/{$user->studio_slug}/bookings", $this->payload(['website' => 'http://spam.test']))
            ->assertCreated();

        $this->assertDatabaseCount('booking_requests', 0);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_empty_honeypot_does_not_block_real_requests(): void
    {
        $user = User::factory()->create();

        $this->postJson("/api/public/studios/{$user->studio_slug}/bookings", $this->payload(['website' => '']))
            ->assertCreated();

        $this->assertDatabaseCount('booking_requests', 1);
    }

    public function test_booking_submissions_are_limited_per_ip_and_studio(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $url = "/api/public/studios/{$user->studio_slug}/bookings";

        for ($i = 0; $i < 5; $i++) {
            $this->postJson($url, $this->payload())->assertCreated();
        }

        $this->postJson($url, $this->payload())->assertTooManyRequests();
        $this->assertDatabaseCount('booking_requests', 5);

        // El limite es por estudio: otro estudio sigue aceptando solicitudes desde la misma IP.
        $this->postJson("/api/public/studios/{$other->studio_slug}/bookings", $this->payload())->assertCreated();
    }

    public function test_invalid_tokens_are_uniform_404_on_every_public_portal(): void
    {
        $this->getJson('/api/public/deliveries/token-inexistente')->assertNotFound();
        $this->postJson('/api/public/deliveries/token-inexistente/approve')->assertNotFound();
        $this->postJson('/api/public/deliveries/token-inexistente/request-changes', ['message' => 'x'])->assertNotFound();
        $this->getJson('/api/public/contracts/token-inexistente')->assertNotFound();
        $this->postJson('/api/public/contracts/token-inexistente/accept')->assertNotFound();
        $this->postJson('/api/public/contracts/token-inexistente/reject')->assertNotFound();
        $this->getJson('/api/public/calendar/token-inexistente')->assertNotFound();
    }

    public function test_public_surface_shares_a_general_throttle(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->getJson('/api/public/deliveries/token-inexistente')->assertNotFound();
        }

        $this->getJson('/api/public/deliveries/token-inexistente')->assertTooManyRequests();
    }
}
