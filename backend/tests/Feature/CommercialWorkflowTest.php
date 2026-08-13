<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommercialWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->client = Client::create(['user_id' => $this->user->id, 'name' => 'Cliente', 'status' => 'active']);
        Sanctum::actingAs($this->user);
    }

    public function test_quote_totals_status_invoice_and_pdf_flow(): void
    {
        $quote = $this->postJson('/api/quotes', [
            'client_id' => $this->client->id,
            'tax_rate' => 21,
            'items' => [
                ['description' => 'Sesión', 'quantity' => 1, 'unit_price' => 400],
                ['description' => 'Copias', 'quantity' => 2, 'unit_price' => 50],
            ],
        ])->assertCreated()->json('data');

        $this->assertSame('500.00', $quote['subtotal']);
        $this->assertSame('105.00', $quote['tax_amount']);
        $this->assertSame('605.00', $quote['total']);
        $this->assertStringStartsWith('PRE-', $quote['quote_number']);

        $this->patchJson("/api/quotes/{$quote['id']}/status", ['status' => 'accepted'])->assertOk();
        $invoice = $this->postJson('/api/invoices', ['quote_id' => $quote['id']])->assertCreated()->json('data');
        $this->assertSame('605.00', $invoice['total']);
        $this->assertStringStartsWith('FAC-', $invoice['invoice_number']);

        $this->get("/api/quotes/{$quote['id']}/pdf")->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->get("/api/invoices/{$invoice['id']}/pdf")->assertOk()->assertHeader('content-type', 'application/pdf');
    }

    public function test_commercial_resources_of_other_users_are_not_reachable(): void
    {
        $foreign = User::factory()->create();
        $foreignClient = Client::create(['user_id' => $foreign->id, 'name' => 'Ajeno', 'status' => 'active']);
        $quote = Quote::create([
            'user_id' => $foreign->id,
            'client_id' => $foreignClient->id,
            'quote_number' => 'PRE-2026-0001',
            'issue_date' => now()->toDateString(),
        ]);

        $this->getJson("/api/quotes/{$quote->id}")->assertNotFound();
        $this->deleteJson("/api/quotes/{$quote->id}")->assertNotFound();
        $this->postJson('/api/quotes', ['client_id' => $foreignClient->id, 'tax_rate' => 21, 'items' => []])
            ->assertUnprocessable()->assertJsonValidationErrors('client_id');
    }

    public function test_presets_are_scoped_and_can_reference_owned_gear(): void
    {
        $gear = GearItem::create(['user_id' => $this->user->id, 'name' => 'Cámara', 'category' => 'camera']);
        $preset = $this->postJson('/api/presets', [
            'gear_item_id' => $gear->id,
            'name' => 'Retrato exterior',
            'iso' => '100',
            'aperture' => 'f/2.8',
        ])->assertCreated()->json('data');

        $this->assertSame('Cámara', $preset['gear_item']['name']);
        $this->getJson('/api/presets')->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson("/api/presets/{$preset['id']}")->assertNoContent();
    }

    public function test_delivery_gallery_upload_public_favorite_and_delete(): void
    {
        config(['filesystems.default' => 'public']);
        Storage::fake('public');
        $delivery = Delivery::create([
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'title' => 'Galería editorial',
            'status' => 'delivered',
        ]);

        $image = $this->postJson("/api/deliveries/{$delivery->id}/images", [
            'images' => [UploadedFile::fake()->image('foto.jpg', 1200, 800)],
        ])->assertCreated()->json('data.0');

        $this->postJson("/api/public/deliveries/{$delivery->public_token}/images/{$image['id']}/favorite")
            ->assertOk()->assertJsonPath('data.images.0.client_favorite', true);

        $this->deleteJson("/api/deliveries/{$delivery->id}/images/{$image['id']}")->assertNoContent();
        $this->assertDatabaseMissing('delivery_images', ['id' => $image['id']]);
    }
}
