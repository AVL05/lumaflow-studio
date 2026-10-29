<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\GearItem;
use App\Models\Job;
use App\Models\Quote;
use App\Models\Session;
use App\Models\User;
use App\Models\WorkspaceMembership;
use App\Services\ActivityLogger;
use App\Services\AiContextService;
use App\Services\ClientImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceAssociationSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function job(User $owner): Job
    {
        return Job::create(['user_id' => $owner->id, 'title' => 'Synthetic project', 'specialty' => 'general', 'workflow_key' => 'general', 'status' => 'lead', 'contract_status' => 'not_required']);
    }

    private function member(User $owner, User $other, string $role): User
    {
        $actor = $role === 'owner' ? $owner : User::factory()->create();
        if ($role !== 'owner') {
            WorkspaceMembership::create(['workspace_id' => $owner->refresh()->current_workspace_id, 'user_id' => $actor->id, 'role' => $role]);
        }
        WorkspaceMembership::create(['workspace_id' => $other->refresh()->current_workspace_id, 'user_id' => $actor->id, 'role' => 'member']);
        $actor->forceFill(['current_workspace_id' => $owner->current_workspace_id])->saveQuietly();

        return $actor;
    }

    public function test_all_roles_reject_cross_workspace_associations_on_create(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $client = Client::create(['user_id' => $other->id, 'name' => 'Synthetic private', 'status' => 'active']);
        $job = $this->job($other);
        $session = Session::create(['user_id' => $other->id, 'name' => 'Synthetic session', 'date' => now(), 'session_type' => 'portrait', 'status' => 'planned']);
        $gear = GearItem::create(['user_id' => $other->id, 'name' => 'Synthetic camera', 'category' => 'camera', 'condition' => 'good']);
        $quote = Quote::create(['user_id' => $other->id, 'client_id' => $client->id, 'quote_number' => 'PRE-AUDIT', 'issue_date' => now(), 'status' => 'accepted', 'subtotal' => 10, 'tax_rate' => 0, 'tax_amount' => 0, 'total' => 10]);

        foreach (['owner', 'admin', 'member'] as $role) {
            Sanctum::actingAs($this->member($owner, $other, $role));
            $cases = [
                ['/api/jobs', ['title' => 'Project', 'specialty' => 'general', 'workflow_key' => 'general', 'status' => 'lead', 'contract_status' => 'not_required', 'client_id' => $client->id, 'gear_item_ids' => [$gear->id]], ['client_id', 'gear_item_ids.0']],
                ['/api/sessions', ['name' => 'Session', 'date' => now()->toDateString(), 'session_type' => 'portrait', 'status' => 'planned', 'job_id' => $job->id], ['job_id']],
                ['/api/tasks', ['title' => 'Task', 'priority' => 'medium', 'status' => 'todo', 'job_id' => $job->id, 'client_id' => $client->id, 'session_id' => $session->id], ['job_id', 'client_id', 'session_id']],
                ['/api/deliveries', ['title' => 'Delivery', 'status' => 'draft', 'client_id' => $client->id, 'session_id' => $session->id], ['client_id', 'session_id']],
                ['/api/quotes', ['client_id' => $client->id, 'tax_rate' => 21, 'items' => [['description' => 'Service', 'quantity' => 1, 'unit_price' => 10]]], ['client_id']],
                ['/api/checklists', ['name' => 'Checklist', 'type' => 'custom', 'session_id' => $session->id], ['session_id']],
                ['/api/presets', ['name' => 'Preset', 'gear_item_id' => $gear->id], ['gear_item_id']],
                ['/api/contracts', ['title' => 'Contract', 'job_id' => $job->id, 'client_id' => $client->id], ['job_id', 'client_id']],
                ['/api/invoices', ['quote_id' => $quote->id], ['quote_id']],
            ];
            foreach ($cases as [$url, $payload, $errors]) {
                $this->postJson($url, $payload)->assertUnprocessable()->assertJsonValidationErrors($errors);
            }
            $this->postJson('/api/jobs', ['title' => 'Personal project', 'specialty' => 'general', 'workflow_key' => 'general', 'status' => 'lead', 'contract_status' => 'not_required', 'create_workflow_tasks' => false])
                ->assertCreated()->assertJsonPath('data.client_id', null);
        }
    }

    public function test_update_uses_resource_workspace_even_when_current_workspace_differs(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $actor = $this->member($owner, $other, 'member');
        $job = $this->job($other);
        $valid = Client::create(['user_id' => $other->id, 'name' => 'Valid', 'status' => 'active']);
        $invalid = Client::create(['user_id' => $owner->id, 'name' => 'Other workspace', 'status' => 'active']);
        Sanctum::actingAs($actor);
        $payload = ['title' => $job->title, 'specialty' => 'general', 'workflow_key' => 'general', 'status' => 'lead', 'contract_status' => 'not_required'];
        $this->putJson('/api/jobs/'.$job->id, $payload + ['client_id' => $invalid->id])->assertUnprocessable();
        $this->putJson('/api/jobs/'.$job->id, $payload + ['client_id' => $valid->id])->assertOk();
        Sanctum::actingAs(User::factory()->create());
        $this->putJson('/api/jobs/'.$job->id, [])->assertNotFound();
        $this->getJson('/api/jobs/'.$job->id)->assertNotFound();
    }

    public function test_legacy_cross_workspace_rows_fail_closed_on_direct_nested_and_public_reads(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $ownClient = Client::create(['user_id' => $owner->id, 'name' => 'Own', 'status' => 'active']);
        $foreign = Client::create(['user_id' => $other->id, 'name' => 'Private', 'email' => 'private@example.test', 'status' => 'active']);
        $job = $this->job($owner);
        DB::table('photography_jobs')->where('id', $job->id)->update(['client_id' => $foreign->id]);
        $delivery = Delivery::create(['user_id' => $owner->id, 'client_id' => $ownClient->id, 'title' => 'Delivery', 'status' => 'delivered']);
        DB::table('deliveries')->where('id', $delivery->id)->update(['client_id' => $foreign->id]);
        Sanctum::actingAs($owner);
        $this->getJson('/api/jobs/'.$job->id)->assertNotFound();
        $this->getJson('/api/jobs')->assertJsonMissing(['email' => 'private@example.test']);
        $this->getJson('/api/deliveries/'.$delivery->id)->assertNotFound();
        $this->getJson('/api/public/deliveries/'.$delivery->public_token)->assertNotFound();
        $this->assertDatabaseHas('photography_jobs', ['id' => $job->id, 'client_id' => $foreign->id]);
        Sanctum::actingAs($other);
        $this->getJson('/api/clients/'.$foreign->id)->assertOk()->assertJsonPath('data.deliveries_count', 0);
    }

    public function test_legacy_gear_pivot_does_not_expose_another_workspace(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $job = $this->job($owner);
        $gear = GearItem::create(['user_id' => $other->id, 'name' => 'Private camera', 'category' => 'camera', 'condition' => 'good']);
        DB::table('gear_item_job')->insert(['job_id' => $job->id, 'gear_item_id' => $gear->id]);
        Sanctum::actingAs($owner);
        $this->getJson('/api/jobs/'.$job->id)->assertOk()->assertJsonCount(0, 'data.gear_items');
    }

    public function test_model_write_rejects_cross_workspace_reference_outside_http(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $client = Client::create(['user_id' => $other->id, 'name' => 'Foreign', 'status' => 'active']);
        $this->expectException(ValidationException::class);
        Job::create(['user_id' => $owner->id, 'client_id' => $client->id, 'title' => 'Invalid']);
    }

    public function test_public_calendar_does_not_publish_other_membership_workspaces(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->member($owner, $other, 'owner');
        Session::create(['user_id' => $other->id, 'name' => 'Private session canary', 'date' => now(), 'session_type' => 'portrait', 'status' => 'planned']);
        $this->get('/api/public/calendar/'.$owner->calendar_token)->assertOk()->assertDontSee('Private session canary');
    }

    public function test_public_booking_uses_publishing_workspace_instead_of_current_workspace(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->member($owner, $other, 'owner');
        $personal = $owner->refresh()->current_workspace_id;
        $owner->forceFill(['current_workspace_id' => $other->current_workspace_id])->saveQuietly();
        $this->postJson('/api/public/studios/'.$owner->studio_slug.'/bookings', ['name' => 'Synthetic lead', 'email' => 'lead@example.test'])->assertCreated();
        $this->assertDatabaseHas('booking_requests', ['user_id' => $owner->id, 'workspace_id' => $personal, 'email' => 'lead@example.test']);
    }

    public function test_ai_context_does_not_retain_access_after_membership_removal(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $actor = $this->member($owner, $other, 'member');
        $actor->forceFill(['current_workspace_id' => $other->current_workspace_id])->saveQuietly();
        Session::create(['user_id' => $actor->id, 'name' => 'Removed membership canary', 'date' => now(), 'session_type' => 'portrait', 'status' => 'planned']);
        WorkspaceMembership::query()->where('workspace_id', $other->current_workspace_id)->where('user_id', $actor->id)->delete();
        $context = app(AiContextService::class)->forUser($actor);
        $this->assertStringNotContainsString('Removed membership canary', json_encode($context));
    }

    public function test_activity_uses_subject_workspace_and_hides_malformed_legacy_history(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $actor = $this->member($owner, $other, 'member');
        $actor->forceFill(['current_workspace_id' => $other->current_workspace_id])->saveQuietly();
        $job = $this->job($owner);
        $activity = app(ActivityLogger::class)->log($actor, $job, 'comment', 'Synthetic history');
        $this->assertSame($job->workspace_id, $activity->workspace_id);
        $id = DB::table('activities')->insertGetId(['user_id' => $other->id, 'workspace_id' => $other->current_workspace_id, 'subject_type' => Job::class, 'subject_id' => $job->id, 'type' => 'comment', 'description' => 'PRIVATE_HISTORY_CANARY', 'created_at' => now(), 'updated_at' => now()]);
        Sanctum::actingAs($other);
        $this->getJson('/api/activities')->assertOk()->assertDontSee('PRIVATE_HISTORY_CANARY');
        $this->assertDatabaseHas('activities', ['id' => $id]);
    }

    public function test_import_deduplicates_only_inside_the_target_workspace(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->member($owner, $other, 'owner');
        Client::create(['user_id' => $owner->id, 'name' => 'Existing private client', 'email' => 'synthetic@example.test', 'status' => 'active']);
        $owner->forceFill(['current_workspace_id' => $other->current_workspace_id])->saveQuietly();
        $service = app(ClientImportService::class);
        $rows = [['name' => 'Imported client', 'email' => 'synthetic@example.test']];
        $this->assertSame(['imported' => 1, 'skipped' => 0], $service->import($owner, $rows));
        $this->assertSame(['imported' => 0, 'skipped' => 1], $service->import($owner, $rows));
        $this->assertDatabaseHas('clients', ['workspace_id' => $other->current_workspace_id, 'name' => 'Imported client']);
    }
}
