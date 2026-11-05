<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\Job;
use App\Models\PostproductionStage;
use App\Models\Task;
use App\Models\User;
use App\Models\WorkspaceMembership;
use App\Services\DeliveryRevisionService;
use App\Services\PublicDeliveryService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeliveryRevisionTest extends TestCase
{
    use RefreshDatabase;

    private function delivery(): Delivery
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        return Delivery::create(['user_id' => $user->id, 'title' => 'Synthetic film', 'status' => 'delivered', 'gallery_url' => 'https://example.com/v1', 'private_notes' => 'PRIVATE_CANARY']);
    }

    public function test_versions_preserve_links_and_retries_are_idempotent(): void
    {
        $delivery = $this->delivery();
        $payload = ['version' => 0, 'request_id' => fake()->uuid(), 'gallery_url' => 'https://vimeo.com/123', 'notes' => 'Second cut'];
        $this->postJson("/api/deliveries/{$delivery->id}/revisions", $payload)->assertSuccessful()->assertJsonPath('data.revision_number', 2);
        $this->postJson("/api/deliveries/{$delivery->id}/revisions", $payload)->assertOk();
        $this->assertDatabaseCount('delivery_revisions', 2);
        $this->assertDatabaseHas('delivery_revisions', ['delivery_id' => $delivery->id, 'number' => 1, 'gallery_url' => 'https://example.com/v1']);
        $this->postJson("/api/deliveries/{$delivery->id}/revisions", [...$payload, 'gallery_url' => 'https://example.com/changed'])->assertConflict();
        $this->postJson("/api/deliveries/{$delivery->id}/revisions", [...$payload, 'request_id' => fake()->uuid()])->assertConflict();
        $this->postJson("/api/public/deliveries/{$delivery->public_token}/approve", ['revision_number' => 1])->assertConflict();
        $this->postJson("/api/public/deliveries/{$delivery->public_token}/approve")->assertUnprocessable();
    }

    public function test_receipt_review_changes_approval_and_comments_keep_history_without_duplicate_effects(): void
    {
        $delivery = $this->delivery();
        $base = "/api/public/deliveries/{$delivery->public_token}";
        $this->getJson($base)->assertOk()->assertJsonMissing(['private_notes' => 'PRIVATE_CANARY']);
        $this->assertNull($delivery->fresh()->review_state);
        foreach (['receive' => 'received', 'review' => 'in_review', 'request-changes' => 'changes_requested', 'approve' => 'approved'] as $action => $state) {
            $payload = ['revision_number' => 1, 'request_id' => fake()->uuid(), ...($action === 'request-changes' ? ['message' => 'Synthetic correction'] : [])];
            $this->postJson("$base/$action", $payload)->assertOk()->assertJsonPath('data.review_state', $state);
            $count = $delivery->activities()->count();
            $notifications = $delivery->user->notifications()->count();
            $this->postJson("$base/$action", $payload)->assertOk();
            $this->assertSame($count, $delivery->activities()->count());
            $this->assertSame($notifications, $delivery->user->notifications()->count());
        }
        $comment = ['revision_number' => 1, 'request_id' => fake()->uuid(), 'message' => 'Thanks'];
        $this->postJson("$base/comment", $comment)->assertOk();
        $this->postJson("$base/comment", $comment)->assertOk();
        $this->assertSame(1, $delivery->activities()->where('description', 'Thanks')->count());
        $this->getJson("$base/history")->assertOk()->assertDontSee('PRIVATE_CANARY')->assertDontSee('user_id');
    }

    public function test_personal_deliveries_tokens_and_foreign_access(): void
    {
        $delivery = $this->delivery();
        $this->postJson('/api/deliveries', ['title' => 'Personal', 'status' => 'draft', 'client_id' => null])->assertCreated()->assertJsonPath('data.client_id', null);
        $url = "/api/deliveries/{$delivery->id}";
        $this->postJson("$url/revisions", ['version' => 0, 'request_id' => fake()->uuid(), 'gallery_url' => 'http://example.com'])->assertUnprocessable();
        $this->postJson("$url/portal", ['version' => 0, 'action' => 'revoke'])->assertOk();
        $this->getJson("/api/public/deliveries/{$delivery->public_token}")->assertNotFound();
        $new = $this->postJson("$url/portal", ['version' => 1, 'action' => 'rotate'])->assertOk()->json('data.public_token');
        $this->assertNotSame($delivery->public_token, $new);
        $this->getJson("/api/public/deliveries/$new")->assertOk();
        Sanctum::actingAs(User::factory()->create());
        $this->getJson("$url/history")->assertNotFound();
        $this->postJson("$url/revisions", ['version' => 2, 'request_id' => fake()->uuid(), 'gallery_url' => 'https://example.com'])->assertNotFound();
        $this->postJson("$url/portal", ['version' => 2, 'action' => 'revoke'])->assertNotFound();
    }

    public function test_legacy_edits_preserve_previous_content_and_cannot_reassign_published_history(): void
    {
        $delivery = $this->delivery();
        $url = "/api/deliveries/{$delivery->id}";
        $data = ['title' => $delivery->title, 'status' => 'delivered', 'gallery_url' => 'https://example.com/new', 'version' => 0];
        $this->putJson($url, $data)->assertOk()->assertJsonPath('data.revision_number', 2);
        $this->assertDatabaseHas('delivery_revisions', ['number' => 1, 'gallery_url' => 'https://example.com/v1']);
        $this->putJson($url, $data)->assertConflict();
        $client = Client::create(['user_id' => $delivery->user_id, 'name' => 'Synthetic other client', 'status' => 'active']);
        $this->putJson($url, [...$data, 'version' => $delivery->fresh()->version, 'client_id' => $client->id])->assertUnprocessable();
        $this->postJson('/api/bulk-actions', ['resource' => 'deliveries', 'action' => 'client', 'ids' => [$delivery->id], 'client_id' => $client->id])->assertUnprocessable();
        $this->assertNull($delivery->fresh()->client_id);
        $this->putJson($url, ['title' => $delivery->title, 'status' => 'draft'])->assertOk();
        $this->putJson($url, ['title' => $delivery->title, 'status' => 'draft', 'client_id' => $client->id])->assertUnprocessable();
    }

    public function test_expiry_is_checked_against_a_stale_public_reader_and_cannot_reactivate_revocation(): void
    {
        $delivery = $this->delivery();
        $stale = app(PublicDeliveryService::class)->resolve($delivery->public_token);
        $delivery->forceFill(['gallery_expires_at' => today()->subDay()])->save();
        $this->getJson("/api/public/deliveries/{$delivery->public_token}/history")->assertNotFound();
        try {
            app(PublicDeliveryService::class)->approve($stale);
            $this->fail('Expired stale reader must not approve.');
        } catch (ModelNotFoundException) {
            $this->assertSame('delivered', $delivery->fresh()->status);
        }
        $delivery->forceFill(['gallery_expires_at' => null, 'portal_revoked_at' => now()])->save();
        $this->postJson("/api/deliveries/{$delivery->id}/portal", ['version' => 0, 'action' => 'expiry', 'expires_on' => today()->addDay()->toDateString()])->assertOk();
        $this->getJson("/api/public/deliveries/{$delivery->public_token}")->assertNotFound();
    }

    public function test_approval_respects_open_tasks_and_other_deliveries_in_postproduction(): void
    {
        $delivery = $this->delivery();
        $job = Job::create(['user_id' => $delivery->user_id, 'title' => 'Synthetic personal project']);
        $delivery->update(['job_id' => $job->id]);
        $stage = PostproductionStage::create(['user_id' => $delivery->user_id, 'workspace_id' => $delivery->workspace_id, 'job_id' => $job->id, 'key' => 'delivered', 'label' => 'Final delivery']);
        $task = Task::create(['user_id' => $delivery->user_id, 'workspace_id' => $delivery->workspace_id, 'job_id' => $job->id, 'stage_id' => $stage->id, 'title' => 'Check exports', 'status' => 'todo']);
        $base = "/api/public/deliveries/{$delivery->public_token}";
        $this->postJson("$base/request-changes", ['message' => 'First'])->assertOk();
        $this->postJson("$base/request-changes", ['message' => 'Another real request'])->assertOk();
        $this->assertSame(2, $delivery->activities()->where('type', 'comment')->count());
        $this->postJson("$base/approve")->assertOk();
        $this->assertSame('in_progress', $stage->fresh()->status);
        $this->assertSame('todo', $task->fresh()->status);
        $task->update(['status' => 'completed']);
        $other = Delivery::create(['user_id' => $delivery->user_id, 'job_id' => $job->id, 'title' => 'Other export', 'status' => 'delivered']);
        app(DeliveryRevisionService::class)->syncStages($delivery->fresh(), 'approved');
        $this->assertSame('in_progress', $stage->fresh()->status);
        $other->update(['status' => 'approved']);
        app(DeliveryRevisionService::class)->syncStages($delivery->fresh(), 'approved');
        $this->assertSame('completed', $stage->fresh()->status);
    }

    public function test_workspace_members_share_revision_access_but_foreign_relations_stay_hidden(): void
    {
        $delivery = $this->delivery();
        $foreign = User::factory()->create();
        $client = Client::create(['user_id' => $foreign->id, 'name' => 'Synthetic foreign', 'status' => 'active']);
        foreach (['owner', 'admin', 'member'] as $role) {
            $actor = $role === 'owner' ? $delivery->user : User::factory()->create();
            if ($role !== 'owner') {
                WorkspaceMembership::create(['user_id' => $actor->id, 'workspace_id' => $delivery->workspace_id, 'role' => $role]);
            }
            Sanctum::actingAs($actor);
            $this->getJson("/api/deliveries/{$delivery->id}/history")->assertOk();
            $this->putJson("/api/deliveries/{$delivery->id}", ['title' => 'Synthetic', 'status' => 'delivered', 'client_id' => $client->id])->assertUnprocessable();
        }
    }

    public function test_additive_migration_preserves_legacy_ids_links_money_and_comments(): void
    {
        $delivery = $this->delivery();
        $delivery->forceFill(['gallery_url' => 'http://example.com/historical', 'budget' => 123, 'client_message' => 'Historical correction', 'client_responded_at' => '2026-01-01 12:00:00'])->save();
        Schema::drop('delivery_revisions');
        Schema::table('deliveries', fn ($table) => $table->dropColumn(['version', 'revision_number', 'review_state', 'portal_revoked_at']));
        $migration = require database_path('migrations/2026_11_02_000001_add_delivery_revisions.php');
        $migration->up();
        $restored = Delivery::findOrFail($delivery->id);
        $this->assertSame($delivery->public_token, $restored->public_token);
        $this->assertSame('123.00', $restored->budget);
        $this->assertSame('http://example.com/historical', $restored->gallery_url);
        $this->assertSame(1, $restored->revision_number);
        $this->assertSame('Historical correction', $restored->revisions()->first()->legacy_client_message);
        $this->assertTrue($restored->revisions()->first()->legacy);
        $this->getJson("/api/public/deliveries/{$delivery->public_token}")->assertOk();
        $this->putJson("/api/deliveries/{$delivery->id}", ['title' => 'Historical', 'status' => 'delivered', 'gallery_url' => $restored->gallery_url])->assertOk();
    }

    public function test_private_draft_versions_are_never_exposed_by_the_public_history(): void
    {
        $delivery = $this->delivery();
        $delivery->update(['status' => 'draft', 'gallery_url' => 'https://example.com/PRIVATE_DRAFT_CANARY']);
        app(DeliveryRevisionService::class)->snapshot($delivery);
        $this->postJson("/api/deliveries/{$delivery->id}/revisions", ['version' => 0, 'request_id' => fake()->uuid(), 'gallery_url' => 'https://example.com/public-cut'])->assertOk();
        $this->getJson("/api/public/deliveries/{$delivery->public_token}/history")->assertOk()->assertDontSee('PRIVATE_DRAFT_CANARY')->assertJsonCount(1, 'revisions.data');
        $this->getJson("/api/deliveries/{$delivery->id}/history")->assertOk()->assertSee('PRIVATE_DRAFT_CANARY');
    }

    public function test_project_scoped_personal_creation_uses_the_project_workspace_and_never_fetches_media(): void
    {
        $delivery = $this->delivery();
        $job = Job::create(['user_id' => $delivery->user_id, 'title' => 'Synthetic project']);
        $member = User::factory()->create();
        WorkspaceMembership::create(['workspace_id' => $job->workspace_id, 'user_id' => $member->id, 'role' => 'member']);
        Sanctum::actingAs($member);
        Http::preventStrayRequests();
        Storage::fake('local');
        $personal = $this->postJson("/api/jobs/{$job->id}/deliveries", ['title' => 'Personal export', 'status' => 'delivered', 'gallery_url' => 'https://example.com/film.mp4'])->assertCreated()->json('data');
        $created = Delivery::findOrFail($personal['id']);
        $this->assertSame($job->workspace_id, $created->workspace_id);
        $this->assertNull($created->client_id);
        $this->assertSame([], Storage::disk('local')->allFiles());
        $this->postJson("/api/deliveries/{$created->id}/revisions", ['version' => 0, 'request_id' => fake()->uuid(), 'gallery_url' => 'https://example.com/film-v2.mp4'])->assertOk();
        $this->assertSame([], Storage::disk('local')->allFiles());
    }
}
