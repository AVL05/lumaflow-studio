<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\PublicDeliveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PublicDeliverySecurityTest extends TestCase
{
    use RefreshDatabase;

    private function delivery(array $attributes = []): Delivery
    {
        $owner = User::factory()->create();
        $client = Client::create(['user_id' => $owner->id, 'name' => 'Synthetic', 'status' => 'active']);

        return Delivery::create($attributes + ['user_id' => $owner->id, 'client_id' => $client->id, 'title' => 'Synthetic delivery', 'status' => 'delivered']);
    }

    public function test_repeated_approval_keeps_one_notification_and_one_transition(): void
    {
        $delivery = $this->delivery();
        $url = '/api/public/deliveries/'.$delivery->public_token.'/approve';
        $this->postJson($url)->assertOk()->assertJsonPath('data.status', 'approved');
        $responded = $delivery->fresh()->client_responded_at;
        $this->travel(10)->seconds();
        $this->postJson($url)->assertOk()->assertJsonPath('data.status', 'approved');
        $this->assertEquals($responded, $delivery->fresh()->client_responded_at);
        $this->assertSame(1, $delivery->user->notifications()->count());
        $this->assertSame(1, Activity::query()->where('subject_id', $delivery->id)->where('type', 'status_changed')->count());
    }

    public function test_identical_change_requests_are_idempotent_and_distinct_comments_are_retained_in_activity(): void
    {
        $delivery = $this->delivery();
        $url = '/api/public/deliveries/'.$delivery->public_token.'/request-changes';
        foreach (['First correction', 'First correction', 'Second correction'] as $message) {
            $this->postJson($url, ['message' => $message])->assertOk();
        }
        $this->assertSame(2, $delivery->user->notifications()->count());
        $this->assertSame('Second correction', $delivery->fresh()->client_message);
        $this->assertDatabaseHas('activities', ['subject_id' => $delivery->id, 'description' => 'First correction']);
        $this->assertDatabaseHas('activities', ['subject_id' => $delivery->id, 'description' => 'Second correction']);
    }

    public function test_approved_delivery_rejects_further_changes_without_losing_the_original_comment(): void
    {
        $delivery = $this->delivery(['client_message' => 'Existing comment']);
        $base = '/api/public/deliveries/'.$delivery->public_token;
        $this->postJson($base.'/approve')->assertOk();
        $this->postJson($base.'/request-changes', ['message' => 'Late change'])->assertUnprocessable();
        $this->assertSame('Existing comment', $delivery->fresh()->client_message);
        $this->assertSame(1, $delivery->user->notifications()->count());
    }

    public function test_drafts_archived_expired_and_unknown_portals_all_return_404(): void
    {
        foreach ([['status' => 'draft'], ['status' => 'archived'], ['gallery_expires_at' => now()->subDay()]] as $attributes) {
            $delivery = $this->delivery($attributes);
            $base = '/api/public/deliveries/'.$delivery->public_token;
            $this->getJson($base)->assertNotFound();
            $this->postJson($base.'/approve')->assertNotFound();
            $this->postJson($base.'/request-changes', ['message' => 'Synthetic'])->assertNotFound();
            $this->assertSame(0, $delivery->user->notifications()->count());
        }
        $this->getJson('/api/public/deliveries/unknown')->assertNotFound();
    }

    public function test_expiry_today_and_pending_review_remain_usable(): void
    {
        $delivery = $this->delivery(['status' => 'pending', 'gallery_expires_at' => today()]);
        $this->getJson('/api/public/deliveries/'.$delivery->public_token)->assertOk();
    }

    public function test_delivery_links_allow_http_providers_but_reject_unsafe_schemes_and_credentials(): void
    {
        $delivery = $this->delivery();
        Sanctum::actingAs($delivery->user);
        $payload = ['title' => 'External delivery', 'status' => 'delivered', 'client_id' => $delivery->client_id];
        foreach (['ftp://example.test/private', 'javascript:alert(1)', 'https://user:synthetic-secret@example.test/private'] as $url) {
            $this->postJson('/api/deliveries', $payload + ['gallery_url' => $url])->assertUnprocessable()->assertJsonValidationErrors('gallery_url');
        }
        $this->postJson('/api/deliveries', $payload + ['gallery_url' => 'https://example.test/shared?access=synthetic'])->assertCreated();
        $this->postJson('/api/deliveries', $payload + ['gallery_url' => 'https://example.test?recipient=synthetic@example.test'])->assertCreated();
    }

    public function test_legacy_unsafe_link_is_not_published(): void
    {
        $delivery = $this->delivery(['gallery_url' => 'javascript:alert(1)']);
        $this->getJson('/api/public/deliveries/'.$delivery->public_token)->assertNotFound();
    }

    public function test_notification_failure_rolls_back_status_and_activity(): void
    {
        $delivery = $this->delivery();
        $this->mock(NotificationService::class)->shouldReceive('success')->once()->andThrow(new \RuntimeException('Synthetic notification failure'));
        try {
            app(PublicDeliveryService::class)->approve($delivery);
            $this->fail('The notification failure must propagate.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Synthetic notification failure', $exception->getMessage());
        }
        $this->assertSame('delivered', $delivery->fresh()->status);
        $this->assertSame(0, Activity::query()->where('subject_id', $delivery->id)->count());
    }

    public function test_stale_different_comment_conflicts_without_overwriting_history(): void
    {
        $delivery = $this->delivery();
        $stale = $delivery->fresh();
        $service = app(PublicDeliveryService::class);
        $service->requestChanges($delivery, 'First correction');
        try {
            $service->requestChanges($stale, 'Conflicting correction');
            $this->fail('A stale correction must not overwrite the accepted one.');
        } catch (HttpException $exception) {
            $this->assertSame(409, $exception->getStatusCode());
        }
        $this->assertSame('First correction', $delivery->fresh()->client_message);
        $this->assertSame(1, $delivery->user->notifications()->count());
    }
}
