<?php

namespace Tests\Feature;

use App\Models\Checklist;
use App\Models\Job;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;
use App\Models\WorkspaceMembership;
use App\Services\ChecklistService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function project(): Job
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        return Job::create(['user_id' => $owner->id, 'title' => 'Synthetic workflow', 'status' => 'quoted', 'description' => 'Historical briefing']);
    }

    public function test_preview_confirmation_and_repeat_application_preserve_legacy_data(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id.'/workflow';
        $this->getJson($url.'/templates')->assertOk()->assertJsonCount(9, 'builtins');
        $preview = $this->getJson($url.'/templates/portrait/preview')->assertOk()->json('data');
        $this->assertSame(0, $job->tasks()->count());
        $this->postJson($url.'/templates/portrait/apply', ['preview_hash' => $preview['hash']])->assertUnprocessable();
        $payload = ['preview_hash' => $preview['hash'], 'confirmed' => true];
        $this->postJson($url.'/templates/portrait/apply', $payload)->assertOk()->assertJsonPath('data.already_applied', false);
        $count = $job->tasks()->count();
        $this->assertGreaterThan(0, $count);
        $this->postJson($url.'/templates/portrait/apply', $payload)->assertOk()->assertJsonPath('data.already_applied', true);
        $this->assertSame($count, $job->tasks()->count());
        $this->assertSame('quoted', $job->fresh()->status);
        $this->assertSame('Historical briefing', $job->fresh()->description);
        $this->assertSame(0, $job->tasks()->whereNotNull('due_date')->count());
        $this->assertSame(0, $job->tasks()->whereNotNull('assigned_user_id')->count());
        $this->getJson($url)->assertOk()->assertJsonCount(8, 'data.stages');
    }

    public function test_foreign_project_is_hidden_before_validating_templates_or_stages(): void
    {
        $job = $this->project();
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/jobs/'.$job->id.'/workflow')->assertNotFound();
        $this->postJson('/api/jobs/'.$job->id.'/workflow/templates', [])->assertNotFound();
        $this->postJson('/api/jobs/'.$job->id.'/workflow/initialize')->assertNotFound();
    }

    public function test_all_nine_templates_are_valid_editable_copies_without_synthetic_resources(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id.'/workflow';
        foreach (config('project_templates') as $template) {
            $own = $this->postJson($url.'/templates', Arr::only($template, ['name', 'description', 'definition']))->assertCreated()->json('data');
            $this->putJson($url.'/templates/'.$own['key'], ['name' => 'Custom '.$template['name'], 'description' => 'Synthetic', 'definition' => $template['definition'], 'revision' => 0])->assertOk()->assertJsonPath('data.revision', 1);
            $this->putJson($url.'/templates/'.$own['key'], ['name' => 'Stale', 'definition' => $template['definition'], 'revision' => 0])->assertConflict();
        }
        $this->getJson($url.'/templates')->assertJsonPath('meta.total', 9);
        $invalid = config('project_templates.portrait');
        $invalid['definition']['tasks'][0]['due_date'] = '2030-01-01';
        $this->postJson($url.'/templates', Arr::only($invalid, ['name', 'description', 'definition']))->assertUnprocessable();
        $large = config('project_templates.portrait');
        $large['definition']['stages'] = [];
        for ($i = 0; $i < 16; $i++) {
            $large['definition']['stages'][] = ['key' => 'stage_'.$i, 'label' => 'Synthetic', 'tasks' => array_fill(0, 16, 'Synthetic task'), 'checklists' => [['name' => 'Synthetic checks', 'items' => array_fill(0, 20, 'Synthetic check')]]];
        }
        $this->postJson($url.'/templates', Arr::only($large, ['name', 'description', 'definition']))->assertUnprocessable();
    }

    public function test_stale_preview_requires_confirmation_of_the_new_plan_and_reuses_tasks(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id.'/workflow';
        $preview = $this->getJson($url.'/templates/portrait/preview')->json('data');
        $title = config('project_templates.portrait.definition.stages.0.tasks.0');
        $existing = Task::create(['user_id' => $job->user_id, 'job_id' => $job->id, 'title' => $title, 'status' => 'completed', 'priority' => 'high', 'due_date' => '2030-01-01']);
        $checkName = config('project_templates.portrait.definition.stages.0.checklists.0.name');
        $check = app(ChecklistService::class)->createWithTemplate($job->user_id, ['job_id' => $job->id, 'name' => $checkName, 'type' => 'custom', 'items' => ['Historical completed control']]);
        $check->items()->first()->update(['is_completed' => true]);
        $this->postJson($url.'/templates/portrait/apply', ['confirmed' => true, 'preview_hash' => $preview['hash']])->assertConflict();
        $preview = $this->getJson($url.'/templates/portrait/preview')->json('data');
        $this->postJson($url.'/templates/portrait/apply', ['confirmed' => true, 'preview_hash' => $preview['hash']])->assertOk();
        $this->assertSame(1, $job->tasks()->where('title', $title)->count());
        $this->assertNotNull($existing->fresh()->stage_id);
        $this->assertSame('completed', $existing->fresh()->status);
        $this->assertSame('2030-01-01', $existing->fresh()->due_date->toDateString());
        $this->assertSame(1, $job->checklists()->where('name', $checkName)->count());
        $this->assertSame(2, $check->items()->count());
        $this->assertTrue($check->items()->where('title', 'Historical completed control')->first()->is_completed);
    }

    public function test_stage_transitions_progress_reopening_order_and_stale_revisions(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id.'/workflow';
        $this->postJson($url.'/initialize', ['confirmed' => true])->assertOk();
        $this->postJson($url.'/initialize', ['confirmed' => true])->assertOk();
        $this->assertSame(8, $job->stages()->count());
        $stage = $job->stages()->first();
        $task = Task::create(['user_id' => $job->user_id, 'job_id' => $job->id, 'stage_id' => $stage->id, 'title' => 'Synthetic stage task', 'priority' => 'medium', 'status' => 'todo']);
        $this->putJson($url.'/stages/'.$stage->id, ['status' => 'completed', 'revision' => $stage->fresh()->revision])->assertUnprocessable();
        $task->update(['status' => 'completed']);
        $revision = $stage->fresh()->revision;
        $this->putJson($url.'/stages/'.$stage->id, ['status' => 'completed', 'notes' => 'PRIVATE_STAGE_CANARY', 'revision' => $revision])->assertOk()->assertJsonPath('data.progress', 100);
        $this->putJson($url.'/stages/'.$stage->id, ['notes' => 'Stale', 'revision' => $revision])->assertConflict();
        $task->update(['status' => 'todo']);
        $this->assertSame('in_progress', $stage->fresh()->status);
        $second = $job->stages()->skip(1)->first();
        $this->putJson($url.'/stages/'.$second->id.'/move', ['direction' => 'up', 'revision' => $second->revision])->assertOk();
        $this->assertSame($second->id, $job->stages()->first()->id);
        $this->getJson('/api/activities')->assertDontSee('PRIVATE_STAGE_CANARY');
    }

    public function test_roles_and_cross_project_references_and_custom_templates_are_isolated(): void
    {
        $job = $this->project();
        $other = User::factory()->create();
        $foreign = Job::create(['user_id' => $other->id, 'title' => 'Foreign']);
        $sameStudio = Job::create(['user_id' => $job->user_id, 'title' => 'Same studio']);
        $otherSession = Session::create(['user_id' => $job->user_id, 'job_id' => $sameStudio->id, 'name' => 'Other project session', 'date' => '2030-01-01', 'session_type' => 'other', 'status' => 'planned']);
        $this->postJson('/api/jobs/'.$job->id.'/workflow/initialize', ['confirmed' => true])->assertOk();
        $stage = $job->stages()->first();
        $template = $this->postJson('/api/jobs/'.$job->id.'/workflow/templates', Arr::only(config('project_templates.portrait'), ['name', 'definition']))->assertCreated()->json('data');
        foreach (['owner', 'admin', 'member'] as $role) {
            $actor = $role === 'owner' ? User::find($job->user_id) : User::factory()->create();
            if ($role !== 'owner') {
                WorkspaceMembership::create(['user_id' => $actor->id, 'workspace_id' => $job->workspace_id, 'role' => $role]);
            }
            Sanctum::actingAs($actor);
            $this->getJson('/api/jobs/'.$job->id.'/workflow')->assertOk();
            $this->putJson('/api/jobs/'.$job->id.'/workflow/stages/'.$stage->id, ['revision' => $stage->fresh()->revision, 'assigned_user_id' => $actor->id])->assertOk();
            $this->putJson('/api/jobs/'.$job->id.'/workflow/stages/'.$stage->id, ['revision' => $stage->fresh()->revision, 'assigned_user_id' => $other->id])->assertUnprocessable();
            $this->putJson('/api/jobs/'.$sameStudio->id.'/workflow/stages/'.$stage->id, [])->assertNotFound();
            $this->postJson('/api/tasks', ['job_id' => $sameStudio->id, 'stage_id' => $stage->id, 'title' => 'Invalid association', 'priority' => 'medium', 'status' => 'todo'])->assertUnprocessable();
            $this->postJson('/api/jobs/'.$job->id.'/workflow/checklists', ['stage_id' => $stage->id, 'session_id' => $otherSession->id, 'name' => 'Invalid session association', 'type' => 'custom'])->assertUnprocessable();
            $check = $this->postJson('/api/jobs/'.$job->id.'/workflow/checklists', ['stage_id' => $stage->id, 'name' => 'Synthetic read guard', 'type' => 'custom'])->assertCreated()->json('data');
            DB::table('checklists')->where('id', $check['id'])->update(['session_id' => $otherSession->id]);
            $this->getJson('/api/checklists/'.$check['id'])->assertNotFound();
        }
        Sanctum::actingAs($other);
        $this->getJson('/api/jobs/'.$foreign->id.'/workflow/templates/'.$template['key'].'/preview')->assertNotFound();
        $this->putJson('/api/jobs/'.$foreign->id.'/workflow/templates/'.$template['key'], [])->assertNotFound();
    }

    public function test_nested_tasks_and_checklists_use_project_workspace_and_guard_revisions(): void
    {
        $job = $this->project();
        $owner = User::find($job->user_id);
        $otherOwner = User::factory()->create();
        WorkspaceMembership::create(['user_id' => $owner->id, 'workspace_id' => $otherOwner->current_workspace_id, 'role' => 'member']);
        $owner->update(['current_workspace_id' => $otherOwner->current_workspace_id]);
        Sanctum::actingAs($owner->fresh());
        $url = '/api/jobs/'.$job->id.'/workflow';
        $stage = $this->postJson($url.'/stages', ['label' => 'Synthetic stage'])->assertCreated()->json('data');
        $task = $this->postJson($url.'/tasks', ['stage_id' => $stage['id'], 'title' => 'Synthetic task', 'priority' => 'medium', 'status' => 'todo'])->assertCreated()->json('data');
        $this->assertDatabaseHas('tasks', ['id' => $task['id'], 'workspace_id' => $job->workspace_id, 'job_id' => $job->id]);
        $payload = ['job_id' => $job->id, 'title' => 'Synthetic task', 'priority' => 'medium', 'status' => 'completed', 'revision' => 0];
        $this->putJson('/api/tasks/'.$task['id'], $payload)->assertOk()->assertJsonPath('data.revision', 1);
        $this->putJson('/api/tasks/'.$task['id'], $payload)->assertConflict();
        $check = $this->postJson($url.'/checklists', ['stage_id' => $stage['id'], 'name' => 'Synthetic check', 'type' => 'custom', 'items' => ['Verify']])->assertCreated()->json('data');
        $this->assertDatabaseHas('checklists', ['id' => $check['id'], 'workspace_id' => $job->workspace_id, 'job_id' => $job->id]);
        $current = $job->stages()->find($stage['id']);
        $this->putJson($url.'/stages/'.$stage['id'], ['status' => 'completed', 'revision' => $current->revision])->assertUnprocessable();
        $itemId = $check['items'][0]['id'];
        $this->patchJson('/api/checklist-items/'.$itemId.'/toggle', ['is_completed' => true])->assertOk();
        $this->putJson($url.'/stages/'.$stage['id'], ['status' => 'completed', 'revision' => $current->fresh()->revision])->assertOk();
        $this->patchJson('/api/checklist-items/'.$itemId.'/toggle', ['is_completed' => false])->assertOk();
        $this->assertSame('in_progress', $current->fresh()->status);
    }

    public function test_additive_migration_preserves_previous_tasks_and_checklists(): void
    {
        $migration = require database_path('migrations/2026_11_01_000001_add_project_workflows.php');
        $migration->down();
        $job = $this->project();
        $task = Task::create(['user_id' => $job->user_id, 'job_id' => $job->id, 'title' => 'Historical task', 'description' => 'Historical task notes', 'status' => 'waiting', 'priority' => 'high']);
        $check = Checklist::create(['user_id' => $job->user_id, 'name' => 'Historical checklist', 'type' => 'custom', 'position' => 0]);
        $migration->up();
        $this->assertSame('Historical task notes', $task->fresh()->description);
        $this->assertSame('waiting', $task->fresh()->status);
        $this->assertSame(0, $task->fresh()->revision);
        $this->assertNull($task->fresh()->stage_id);
        $this->assertSame('Historical checklist', $check->fresh()->name);
        $this->assertNull($check->fresh()->job_id);
    }

    public function test_custom_templates_are_reusable_without_rewriting_previous_applications(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id.'/workflow';
        $template = $this->postJson($url.'/templates', Arr::only(config('project_templates.portrait'), ['name', 'definition']))->assertCreated()->assertJsonPath('data.revision', 0)->json('data');
        $preview = $this->getJson($url.'/templates/'.$template['key'].'/preview')->json('data');
        $this->postJson($url.'/templates/'.$template['key'].'/apply', ['confirmed' => true, 'preview_hash' => $preview['hash']])->assertOk();
        $definition = $template['definition'];
        $definition['tasks'][] = ['title' => 'Synthetic custom preparation', 'phase' => 'preparation'];
        $this->putJson($url.'/templates/'.$template['key'], ['name' => 'Updated synthetic template', 'definition' => $definition, 'revision' => 0])->assertOk();
        $this->assertSame(12, $job->tasks()->count());
        $preview = $this->getJson($url.'/templates/'.$template['key'].'/preview')->json('data');
        $this->postJson($url.'/templates/'.$template['key'].'/apply', ['confirmed' => true, 'preview_hash' => $preview['hash']])->assertOk()->assertJsonPath('data.already_applied', true);
        $other = Job::create(['user_id' => $job->user_id, 'title' => 'Synthetic next project']);
        $nextUrl = '/api/jobs/'.$other->id.'/workflow';
        $preview = $this->getJson($nextUrl.'/templates/'.$template['key'].'/preview')->assertOk()->json('data');
        $this->postJson($nextUrl.'/templates/'.$template['key'].'/apply', ['confirmed' => true, 'preview_hash' => $preview['hash']])->assertOk();
        $this->assertSame(13, $other->tasks()->count());
        $this->assertSame(12, $job->tasks()->count());
    }
}
