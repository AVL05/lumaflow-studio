<?php

namespace Tests\Feature;

use App\Models\GearItem;
use App\Models\Job;
use App\Models\Location;
use App\Models\Session;
use App\Models\Shot;
use App\Models\User;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ShotListTest extends TestCase
{
    use RefreshDatabase;

    private function project(): Job
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        return Job::create(['user_id' => $owner->id, 'title' => 'Synthetic production', 'status' => 'preparation']);
    }

    public function test_shot_crud_duplicate_order_and_conflict_preserve_data(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id.'/shots';
        $first = $this->postJson($url, ['description' => 'Establishing photograph', 'scene' => null, 'estimated_seconds' => 20])->assertCreated()->json('data');
        $second = $this->postJson($url, ['description' => 'Detail'])->assertCreated()->json('data');
        $this->putJson($url.'/'.$second['id'].'/move', ['direction' => 'up'])->assertOk();
        $this->getJson($url)->assertOk()->assertJsonPath('data.0.id', $second['id'])->assertJsonPath('meta.total', 2);
        $this->patchJson($url.'/'.$first['id'], ['status' => 'done', 'notes' => 'PRIVATE_SHOT_CANARY', 'revision' => 0])->assertOk()->assertJsonPath('data.revision', 1);
        $this->patchJson($url.'/'.$first['id'], ['notes' => 'Stale', 'revision' => 0])->assertConflict();
        $copy = $this->postJson($url.'/'.$first['id'].'/duplicate')->assertCreated()->assertJsonPath('data.status', 'pending')->assertJsonPath('data.notes', null)->json('data');
        $this->assertNotSame($first['id'], $copy['id']);
        $this->deleteJson($url.'/'.$second['id'])->assertNoContent();
        $this->getJson($url)->assertJsonPath('meta.total', 2);
        $this->getJson('/api/activities')->assertDontSee('PRIVATE_SHOT_CANARY');
    }

    public function test_foreign_project_and_cross_project_shots_are_hidden(): void
    {
        $job = $this->project();
        $shot = $this->postJson('/api/jobs/'.$job->id.'/shots', ['description' => 'Synthetic shot'])->assertCreated()->json('data');
        $other = Job::create(['user_id' => $job->user_id, 'title' => 'Other project']);
        $this->patchJson('/api/jobs/'.$other->id.'/shots/'.$shot['id'], ['revision' => 0, 'status' => 'done'])->assertNotFound();
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/jobs/'.$job->id.'/shots')->assertNotFound();
        $this->postJson('/api/jobs/'.$job->id.'/shots', [])->assertNotFound();
        $this->deleteJson('/api/jobs/'.$job->id.'/shots/'.$shot['id'])->assertNotFound();
    }

    public function test_all_roles_enforce_same_workspace_and_project_associations(): void
    {
        $job = $this->project();
        $foreign = User::factory()->create();
        $location = Location::create(['user_id' => $foreign->id, 'name' => 'Foreign', 'latitude' => 0, 'longitude' => 0, 'type' => 'urban']);
        $gear = GearItem::create(['user_id' => $foreign->id, 'name' => 'Foreign gear', 'category' => 'camera', 'condition' => 'active']);
        $otherProject = Job::create(['user_id' => $job->user_id, 'title' => 'Other']);
        $session = Session::create(['user_id' => $job->user_id, 'job_id' => $otherProject->id, 'name' => 'Other day', 'date' => '2030-01-01', 'session_type' => 'other', 'status' => 'planned']);
        foreach (['owner', 'admin', 'member'] as $role) {
            $actor = $role === 'owner' ? User::find($job->user_id) : User::factory()->create();
            if ($role !== 'owner') {
                WorkspaceMembership::create(['user_id' => $actor->id, 'workspace_id' => $job->workspace_id, 'role' => $role]);
            }
            WorkspaceMembership::create(['user_id' => $actor->id, 'workspace_id' => $foreign->current_workspace_id, 'role' => 'member']);
            Sanctum::actingAs($actor);
            $url = '/api/jobs/'.$job->id.'/shots';
            $shot = $this->postJson($url, ['description' => 'Synthetic'])->assertCreated()->json('data');
            foreach ([['location_id' => $location->id], ['gear_item_ids' => [$gear->id]], ['session_id' => $session->id]] as $invalid) {
                $this->patchJson($url.'/'.$shot['id'], $invalid + ['revision' => 0])->assertUnprocessable();
            }
            DB::table('gear_item_shot')->insert(['shot_id' => $shot['id'], 'gear_item_id' => $gear->id]);
            $this->getJson($url)->assertDontSee('Foreign gear');
        }
    }

    public function test_invalid_payload_and_full_pagination_and_boundary_moves(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id.'/shots';
        foreach ([[], ['description' => 'X', 'status' => 'invalid'], ['description' => 'X', 'estimated_seconds' => -1], ['description' => 'X', 'notes' => str_repeat('x', 4001)], ['description' => 'X', 'gear_item_ids' => ['key' => 1]]] as $invalid) {
            $this->postJson($url, $invalid)->assertUnprocessable();
        }
        for ($i = 1; $i <= 25; $i++) {
            Shot::create(['user_id' => $job->user_id, 'workspace_id' => $job->workspace_id, 'job_id' => $job->id, 'description' => 'Synthetic '.$i, 'position' => $i]);
        }
        $this->getJson($url)->assertJsonCount(24, 'data')->assertJsonPath('meta.total', 25);
        $last = $this->getJson($url.'?page=2')->assertJsonCount(1, 'data')->json('data.0');
        $this->putJson($url.'/'.$last['id'].'/move', ['direction' => 'down'])->assertOk();
        $this->putJson($url.'/'.$last['id'].'/move', ['direction' => 'up'])->assertOk();
        $this->getJson($url)->assertJsonPath('data.23.id', $last['id'])->assertJsonPath('meta.total', 25);
        $this->patchJson($url.'/'.$last['id'], ['notes' => 'Without revision'])->assertUnprocessable();
        $this->assertSame(25, $job->shots()->distinct()->count('position'));
    }
}
