<?php

namespace Tests\Feature;

use App\Models\Job;
use App\Models\Location;
use App\Models\User;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CreativeWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $extra = []): array
    {
        return $extra + ['title' => 'Synthetic creative project', 'specialty' => 'general', 'workflow_key' => 'general', 'status' => 'lead', 'contract_status' => 'not_required', 'create_workflow_tasks' => false];
    }

    public function test_personal_and_audiovisual_projects_preserve_optional_client_and_organization(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $location = Location::create(['user_id' => $owner->id, 'name' => 'Synthetic studio', 'latitude' => 0, 'longitude' => 0, 'type' => 'urban']);
        foreach (['personal', 'audiovisual'] as $type) {
            $project = $this->postJson('/api/jobs', $this->payload([
                'project_type' => $type, 'description' => 'Original notes',
                'participants' => [['name' => 'Synthetic crew', 'role' => 'Camera']],
                'start_date' => '2030-03-01', 'end_date' => '2030-03-02', 'delivery_due_date' => '2030-03-10',
                'location_ids' => [$location->id], 'external_links' => [['label' => 'Reference', 'url' => 'https://example.test/reference']],
            ]))->assertCreated()->assertJsonPath('data.client_id', null)->assertJsonPath('data.project_type', $type)->assertJsonPath('data.production_phase', 'preparation')->assertJsonCount(1, 'data.locations')->json('data');
            $this->putJson('/api/jobs/'.$project['id'], $this->payload(['project_type' => $type, 'status' => 'editing']))->assertOk()->assertJsonPath('data.production_phase', 'postproduction')->assertJsonCount(1, 'data.participants')->assertJsonCount(1, 'data.locations');
        }
    }

    public function test_legacy_payload_and_list_contract_remain_compatible_with_opt_in_pagination(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $project = $this->postJson('/api/jobs', $this->payload())->assertCreated()->assertJsonPath('data.project_type', 'photography')->json('data');
        $this->getJson('/api/jobs')->assertOk()->assertJsonPath('data.0.id', $project['id'])->assertJsonMissingPath('meta');
        $this->getJson('/api/jobs?paginate=1&per_page=1')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/jobs?paginate=1&project_type=personal')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_all_roles_reject_foreign_locations_and_outsiders_get_404(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $foreign = Location::create(['user_id' => $other->id, 'name' => 'Private location', 'latitude' => 0, 'longitude' => 0, 'type' => 'urban']);
        $job = Job::create(['user_id' => $owner->id, 'title' => 'Synthetic', 'specialty' => 'general', 'workflow_key' => 'general', 'status' => 'lead']);
        foreach (['owner', 'admin', 'member'] as $role) {
            $actor = $role === 'owner' ? $owner : User::factory()->create();
            if ($actor->id !== $owner->id) {
                WorkspaceMembership::create(['workspace_id' => $owner->current_workspace_id, 'user_id' => $actor->id, 'role' => $role]);
            }
            WorkspaceMembership::create(['workspace_id' => $other->current_workspace_id, 'user_id' => $actor->id, 'role' => 'member']);
            Sanctum::actingAs($actor);
            $this->putJson('/api/jobs/'.$job->id, $this->payload(['location_ids' => [$foreign->id]]))->assertUnprocessable()->assertJsonValidationErrors('location_ids.0');
        }
        DB::table('job_location')->insert(['job_id' => $job->id, 'location_id' => $foreign->id]);
        Sanctum::actingAs($owner);
        $this->getJson('/api/jobs/'.$job->id)->assertOk()->assertJsonCount(0, 'data.locations');
        $this->getJson('/api/jobs/'.$job->id.'/options?resource=locations')->assertOk()->assertJsonCount(0, 'data');
        Sanctum::actingAs($other);
        $this->getJson('/api/jobs/'.$job->id.'/options?resource=locations')->assertNotFound();
        $this->putJson('/api/jobs/'.$job->id, [])->assertNotFound();
        $this->getJson('/api/jobs/'.$job->id)->assertNotFound();
    }

    public function test_invalid_types_dates_payload_sizes_and_links_are_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());
        foreach ([['project_type' => 'unknown'], ['start_date' => '2030-04-02', 'end_date' => '2030-04-01'], ['participants' => [['name' => 'Crew', 'user_id' => 999]]], ['external_links' => [['label' => 'Unsafe', 'url' => 'javascript:alert(1)']]], ['external_links' => [['label' => 'Unsafe', 'url' => 'https://user:secret@example.test']]], ['participants' => array_fill(0, 26, ['name' => 'Crew'])]] as $invalid) {
            $this->postJson('/api/jobs', $this->payload($invalid))->assertUnprocessable();
        }
    }

    public function test_creation_options_are_paginated_and_only_use_current_workspace(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        WorkspaceMembership::create(['user_id' => $owner->id, 'workspace_id' => $other->current_workspace_id, 'role' => 'member']);
        Location::create(['user_id' => $other->id, 'name' => 'Foreign option', 'latitude' => 0, 'longitude' => 0, 'type' => 'urban']);
        for ($i = 0; $i < 25; $i++) {
            Location::create(['user_id' => $owner->id, 'name' => 'Synthetic option '.$i, 'latitude' => 0, 'longitude' => 0, 'type' => 'urban']);
        }
        Sanctum::actingAs($owner);
        $this->getJson('/api/jobs/options?resource=locations')->assertOk()->assertJsonPath('meta.total', 25)->assertJsonCount(24, 'data')->assertDontSee('Foreign option');
        $this->getJson('/api/jobs/options?resource=locations&page=2')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/jobs/options?resource=unknown')->assertUnprocessable();
    }

    public function test_organization_collections_require_lists_instead_of_keyed_objects(): void
    {
        Sanctum::actingAs(User::factory()->create());
        foreach ([['participants' => ['crew' => ['name' => 'Synthetic crew']]], ['external_links' => ['reference' => ['label' => 'Reference', 'url' => 'https://example.test']]], ['location_ids' => ['selected' => 1]]] as $invalid) {
            $this->postJson('/api/jobs', $this->payload($invalid))->assertUnprocessable();
        }
    }

    public function test_additive_migration_preserves_a_preexisting_job(): void
    {
        $migration = require database_path('migrations/2026_10_30_000001_add_creative_workspace_to_jobs.php');
        $migration->down();
        $owner = User::factory()->create();
        $job = Job::create(['user_id' => $owner->id, 'title' => 'Legacy job', 'description' => 'Historical notes', 'budget' => 500, 'specialty' => 'wedding', 'workflow_key' => 'wedding', 'status' => 'quoted']);
        $migration->up();
        Sanctum::actingAs($owner);
        $this->getJson('/api/jobs/'.$job->id)->assertOk()->assertJsonPath('data.id', $job->id)->assertJsonPath('data.description', 'Historical notes')->assertJsonPath('data.project_type', 'photography')->assertJsonPath('data.status', 'quoted')->assertJsonPath('data.budget', '500.00');
    }
}
