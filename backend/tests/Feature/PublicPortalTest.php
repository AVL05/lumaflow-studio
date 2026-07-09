<?php

namespace Tests\Feature;

use App\Mail\DeliveryReadyMail;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicPortalTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['name' => 'Estudio Norte']);
    }

    public function test_booking_request_is_created_from_the_public_slug(): void
    {
        $this->getJson("/api/public/studios/{$this->user->studio_slug}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Estudio Norte');

        $this->postJson("/api/public/studios/{$this->user->studio_slug}/bookings", [
            'name' => 'Cliente potencial',
            'email' => 'lead@example.com',
            'session_type' => 'wedding',
            'preferred_date' => '2026-09-01',
            'message' => 'Nos interesa una sesion de boda.',
        ])->assertCreated();

        $this->assertDatabaseHas('booking_requests', [
            'user_id' => $this->user->id,
            'email' => 'lead@example.com',
            'status' => 'new',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'title' => 'Nueva solicitud de reserva',
        ]);
    }

    public function test_unknown_slug_returns_404(): void
    {
        $this->getJson('/api/public/studios/no-existe')->assertNotFound();
    }

    public function test_booking_request_validates_required_fields(): void
    {
        $this->postJson("/api/public/studios/{$this->user->studio_slug}/bookings", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_client_can_view_and_approve_a_delivery_via_public_token(): void
    {
        $client = Client::create(['user_id' => $this->user->id, 'name' => 'Marca', 'email' => 'marca@example.com', 'status' => 'active']);
        $delivery = Delivery::create([
            'user_id' => $this->user->id,
            'client_id' => $client->id,
            'title' => 'Entrega test',
            'status' => 'delivered',
            'budget' => 500,
        ]);

        $this->getJson("/api/public/deliveries/{$delivery->public_token}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Entrega test')
            ->assertJsonPath('data.studio_name', 'Estudio Norte');

        $this->postJson("/api/public/deliveries/{$delivery->public_token}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('deliveries', ['id' => $delivery->id, 'status' => 'approved']);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'title' => 'Entrega aprobada por el cliente',
        ]);
    }

    public function test_client_can_request_changes_on_a_delivery(): void
    {
        $client = Client::create(['user_id' => $this->user->id, 'name' => 'Marca', 'status' => 'active']);
        $delivery = Delivery::create([
            'user_id' => $this->user->id,
            'client_id' => $client->id,
            'title' => 'Entrega test',
            'status' => 'delivered',
        ]);

        $this->postJson("/api/public/deliveries/{$delivery->public_token}/request-changes", [
            'message' => 'Falta retocar dos fotos.',
        ])
            ->assertOk()
            ->assertJsonPath('data.client_message', 'Falta retocar dos fotos.');

        $this->assertDatabaseHas('deliveries', [
            'id' => $delivery->id,
            'client_message' => 'Falta retocar dos fotos.',
        ]);
    }

    public function test_invalid_delivery_token_returns_404(): void
    {
        $this->getJson('/api/public/deliveries/token-invalido')->assertNotFound();
        $this->postJson('/api/public/deliveries/token-invalido/approve')->assertNotFound();
    }

    public function test_marking_a_delivery_as_delivered_emails_the_client(): void
    {
        Mail::fake();
        Sanctum::actingAs($this->user);

        $client = Client::create(['user_id' => $this->user->id, 'name' => 'Marca', 'email' => 'marca@example.com', 'status' => 'active']);
        $delivery = Delivery::create([
            'user_id' => $this->user->id,
            'client_id' => $client->id,
            'title' => 'Entrega test',
            'status' => 'pending',
        ]);

        $this->putJson("/api/deliveries/{$delivery->id}", [
            'client_id' => $client->id,
            'title' => 'Entrega test',
            'status' => 'delivered',
        ])->assertOk();

        Mail::assertSent(DeliveryReadyMail::class, fn ($mail) => $mail->hasTo('marca@example.com'));
    }

    public function test_calendar_feed_responds_with_ics_content_for_a_valid_token(): void
    {
        $response = $this->get("/api/public/calendar/{$this->user->calendar_token}");

        $response->assertOk();
        $this->assertStringContainsString('text/calendar', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('BEGIN:VCALENDAR', $response->getContent());
    }

    public function test_calendar_feed_rejects_invalid_token(): void
    {
        $this->get('/api/public/calendar/token-invalido')->assertNotFound();
    }

    public function test_photographer_can_manage_booking_requests(): void
    {
        Sanctum::actingAs($this->user);
        $booking = $this->user->bookingRequests()->create([
            'name' => 'Lead', 'email' => 'lead@example.com', 'status' => 'new',
        ]);

        $this->getJson('/api/booking-requests')->assertOk()->assertJsonCount(1, 'data');

        $client = $this->postJson("/api/booking-requests/{$booking->id}/convert")
            ->assertCreated()
            ->json('data');

        $this->assertDatabaseHas('clients', ['id' => $client['id'], 'email' => 'lead@example.com', 'status' => 'lead']);
        $this->assertDatabaseHas('booking_requests', ['id' => $booking->id, 'status' => 'converted']);
    }

    public function test_booking_requests_of_other_users_are_not_reachable(): void
    {
        Sanctum::actingAs($this->user);
        $foreignBooking = User::factory()->create()->bookingRequests()->create([
            'name' => 'Ajena', 'email' => 'ajena@example.com', 'status' => 'new',
        ]);

        $this->patchJson("/api/booking-requests/{$foreignBooking->id}", ['status' => 'archived'])->assertNotFound();
        $this->deleteJson("/api/booking-requests/{$foreignBooking->id}")->assertNotFound();
    }
}
