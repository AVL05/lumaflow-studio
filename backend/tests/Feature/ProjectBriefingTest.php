<?php

namespace Tests\Feature;

use App\Models\Job;
use App\Models\User;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectBriefingTest extends TestCase
{
    use RefreshDatabase;

    private function project(): Job
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        return Job::create(['user_id' => $owner->id, 'title' => 'Synthetic project', 'description' => 'Historical description', 'status' => 'lead']);
    }

    public function test_manual_briefing_roundtrip_is_private_and_keeps_historical_description(): void
    {
        $job = $this->project();
        $this->getJson('/api/jobs/'.$job->id)->assertJsonPath('data.briefing_revision', 0);
        $briefing = ['objectives' => 'Synthetic objectives', 'references' => 'https://example.test/reference', 'technical_requirements' => 'Sound recorder', 'scenes' => 'Interview', 'locations' => 'Interior', 'risks' => 'Noise', 'notes' => 'PRIVATE_BRIEF_CANARY', 'open_questions' => 'Access permission'];
        $this->putJson('/api/jobs/'.$job->id.'/briefing', ['briefing' => $briefing, 'revision' => 0])->assertOk()->assertJsonPath('data.briefing.notes', 'PRIVATE_BRIEF_CANARY')->assertJsonPath('data.briefing_revision', 1)->assertJsonPath('data.description', 'Historical description');
        $this->getJson('/api/jobs/'.$job->id)->assertJsonPath('data.briefing.objectives', 'Synthetic objectives');
        $this->getJson('/api/jobs')->assertJsonMissingPath('data.0.briefing')->assertJsonMissingPath('data.0.participants')->assertJsonMissingPath('data.0.external_links');
        $this->getJson('/api/activities')->assertDontSee('PRIVATE_BRIEF_CANARY');
    }

    public function test_stale_revision_conflicts_without_changing_data_or_history(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id.'/briefing';
        $this->putJson($url, ['briefing' => ['objectives' => 'First'], 'revision' => 0])->assertOk();
        $this->putJson($url, ['briefing' => ['objectives' => 'Stale'], 'revision' => 0])->assertConflict();
        $this->assertSame('First', $job->fresh()->briefing['objectives']);
        $this->assertSame(1, $job->activities()->where('type', 'briefing_updated')->count());
    }

    public function test_owner_admin_and_member_can_edit_and_removed_member_and_outsider_cannot(): void
    {
        $job = $this->project();
        foreach (['admin', 'member'] as $role) {
            $actor = User::factory()->create();
            $membership = WorkspaceMembership::create(['user_id' => $actor->id, 'workspace_id' => $job->workspace_id, 'role' => $role]);
            Sanctum::actingAs($actor);
            $this->putJson('/api/jobs/'.$job->id.'/briefing', ['briefing' => ['notes' => 'Synthetic'], 'revision' => $job->fresh()->briefing_revision])->assertOk();
            $membership->delete();
            $this->putJson('/api/jobs/'.$job->id.'/briefing', [])->assertNotFound();
        }
        Sanctum::actingAs(User::factory()->create());
        $this->putJson('/api/jobs/'.$job->id.'/briefing', [])->assertNotFound();
    }

    public function test_schema_lengths_and_revision_are_validated_without_upload_support(): void
    {
        $job = $this->project();
        foreach ([['briefing' => ['photos' => ['image.jpg']], 'revision' => 0], ['briefing' => ['notes' => str_repeat('x', 4001)], 'revision' => 0], ['briefing' => ['objectives' => ['invalid']], 'revision' => 0], ['briefing' => [], 'revision' => -1], ['briefing' => 'invalid', 'revision' => 0]] as $payload) {
            $this->putJson('/api/jobs/'.$job->id.'/briefing', $payload)->assertUnprocessable();
        }
        $this->putJson('/api/jobs/'.$job->id.'/briefing', ['briefing' => [], 'revision' => 0])->assertOk();
    }
}
