<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_export_requires_authentication(): void
    {
        $this->getJson('/api/account/export')->assertUnauthorized();
    }

    public function test_owner_exports_only_their_own_data(): void
    {
        $owner = User::factory()->create(['name' => 'Estudio Norte']);
        $other = User::factory()->create(['name' => 'Estudio Ajeno']);

        $mine = Client::create(['user_id' => $owner->id, 'name' => 'Cliente Mio', 'email' => 'mio@example.com', 'status' => 'active']);
        Client::create(['user_id' => $other->id, 'name' => 'Cliente Ajeno', 'email' => 'ajeno@example.com', 'status' => 'active']);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/account/export')->assertOk();

        $response->assertJsonPath('account.email', $owner->email)
            ->assertJsonPath('totals.clients', 1)
            ->assertJsonPath('data.clients.0.id', $mine->id)
            ->assertJsonPath('data.clients.0.name', 'Cliente Mio');

        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));
        $this->assertStringNotContainsString('Cliente Ajeno', $response->getContent());
        $this->assertStringNotContainsString('ajeno@example.com', $response->getContent());
        $this->assertStringNotContainsString($other->email, $response->getContent());
    }

    public function test_export_never_contains_secrets(): void
    {
        $owner = User::factory()->create();
        $client = Client::create(['user_id' => $owner->id, 'name' => 'Cliente', 'email' => 'c@example.com', 'status' => 'active']);
        $delivery = Delivery::create([
            'user_id' => $owner->id,
            'client_id' => $client->id,
            'title' => 'Entrega',
            'status' => 'pending',
            'gallery_url' => 'https://example.com/g',
            'gallery_password' => 'clave-secreta-galeria',
        ]);

        Sanctum::actingAs($owner);

        $body = $this->getJson('/api/account/export')->assertOk()->getContent();

        $this->assertStringContainsString('Entrega', $body);
        $this->assertStringNotContainsString('clave-secreta-galeria', $body);
        $this->assertStringNotContainsString($delivery->public_token, $body);
        $this->assertStringNotContainsString('"password"', $body);
        $this->assertStringNotContainsString('remember_token', $body);
    }

    public function test_export_is_rate_limited(): void
    {
        Sanctum::actingAs(User::factory()->create());

        for ($i = 0; $i < 6; $i++) {
            $this->getJson('/api/account/export')->assertOk();
        }

        $this->getJson('/api/account/export')->assertTooManyRequests();
    }
}
