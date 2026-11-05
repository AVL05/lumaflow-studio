<?php

namespace Tests\Feature;

use App\Models\Job;
use App\Models\Session;
use App\Models\User;
use App\Services\ProductionDocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductionDayTest extends TestCase
{
    use RefreshDatabase;

    private function project(): Job
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        return Job::create(['user_id' => $user->id, 'title' => 'Synthetic production']);
    }

    private function payload(array $data = []): array
    {
        return $data + ['name' => 'Synthetic day', 'date' => '2030-05-02', 'time' => '09:00', 'end_time' => '18:00', 'session_type' => 'other', 'status' => 'planned', 'participants' => [['name' => 'Synthetic crew', 'role' => 'Camera']]];
    }

    public function test_day_reuses_session_checklists_and_shots_without_reparenting(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id;
        $day = $this->postJson($url.'/production-days', $this->payload())->assertCreated()->assertJsonPath('data.job_id', $job->id)->assertJsonCount(2, 'data.checklists')->json('data');
        $this->assertDatabaseHas('sessions', ['id' => $day['id'], 'job_id' => $job->id]);
        $shot = $this->postJson($url.'/shots', ['description' => 'Portrait', 'session_id' => $day['id'], 'scheduled_time' => '10:00'])->assertCreated()->json('data');
        $this->putJson($url.'/production-days/'.$day['id'], $this->payload(['notes' => 'Synthetic production notes', 'incidents' => 'Wind']))->assertOk()->assertJsonPath('data.incidents', 'Wind');
        $other = Job::create(['user_id' => $job->user_id, 'title' => 'Other']);
        $this->putJson('/api/sessions/'.$day['id'], ['job_id' => $other->id] + $this->payload())->assertUnprocessable();
        $this->getJson($url.'/production-days')->assertJsonPath('meta.total', 1);
        $this->deleteJson('/api/sessions/'.$day['id'])->assertNoContent();
        $this->getJson($url.'/shots')->assertJsonPath('data.0.id', $shot['id'])->assertJsonPath('data.0.session_id', null);
    }

    public function test_invalid_times_and_foreign_resources_and_pdf_authorization(): void
    {
        $job = $this->project();
        $url = '/api/jobs/'.$job->id;
        $this->postJson($url.'/production-days', $this->payload(['end_time' => '08:00']))->assertUnprocessable();
        $this->postJson($url.'/production-days', $this->payload(['participants' => [['name' => 'X', 'user_id' => 123]]]))->assertUnprocessable();
        $day = $this->postJson($url.'/production-days', $this->payload())->assertCreated()->json('data');
        $other = Job::create(['user_id' => $job->user_id, 'title' => 'Other']);
        $this->putJson('/api/jobs/'.$other->id.'/production-days/'.$day['id'], $this->payload())->assertNotFound();
        $this->getJson('/api/jobs/'.$other->id.'/production/pdf?session_id='.$day['id'])->assertUnprocessable();
        Sanctum::actingAs(User::factory()->create());
        $this->getJson($url.'/production-days')->assertNotFound();
        $this->postJson($url.'/production-days', [])->assertNotFound();
        $this->getJson($url.'/production/pdf')->assertNotFound();
    }

    public function test_pdf_contains_a_valid_document_and_escaped_content(): void
    {
        $job = $this->project();
        $this->postJson('/api/jobs/'.$job->id.'/shots', ['description' => '<script>synthetic</script>', 'shot_type' => 'Plano general'])->assertCreated();
        $html = view('pdf.production', ['job' => $job, 'shots' => $job->shots()->with(['gearItems', 'location'])->get(), 'days' => collect()])->render();
        $this->assertStringNotContainsString('<script>synthetic</script>', $html);
        $this->assertStringContainsString('&lt;script&gt;', $html);
        $response = $this->get('/api/jobs/'.$job->id.'/production/pdf')->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
        DB::table('shots')->insert(array_fill(0, 500, ['job_id' => $job->id, 'workspace_id' => $job->workspace_id, 'user_id' => $job->user_id, 'description' => 'Synthetic export boundary']));
        $this->getJson('/api/jobs/'.$job->id.'/production/pdf')->assertUnprocessable();
    }

    public function test_additive_migration_preserves_a_previous_session_and_job(): void
    {
        $migration = require database_path('migrations/2026_10_30_000002_add_production_planning.php');
        $migration->down();
        $job = $this->project();
        $session = Session::create(['user_id' => $job->user_id, 'job_id' => $job->id, 'name' => 'Historical session', 'date' => '2030-01-01', 'notes' => 'Historical notes', 'session_type' => 'portrait', 'status' => 'planned']);
        $migration->up();
        $this->assertSame('Historical notes', $session->fresh()->notes);
        $this->assertSame($job->id, $session->fresh()->job_id);
        $this->assertNull($session->fresh()->end_time);
        $this->assertSame(0, $job->shots()->count());
    }

    public function test_export_rate_limit_is_separate_from_normal_api_traffic(): void
    {
        $job = $this->project();
        $this->mock(ProductionDocumentService::class, fn ($mock) => $mock->shouldReceive('pdf')->times(5)->andReturn(response('%PDF-synthetic', 200, ['Content-Type' => 'application/pdf'])));
        for ($i = 0; $i < 6; $i++) {
            $this->getJson('/api/jobs/'.$job->id.'/production-days')->assertOk();
        }
        for ($i = 0; $i < 5; $i++) {
            $this->get('/api/jobs/'.$job->id.'/production/pdf')->assertOk();
        }
        $this->get('/api/jobs/'.$job->id.'/production/pdf')->assertStatus(429);
        $this->getJson('/api/jobs/'.$job->id.'/shots')->assertOk();
    }

    public function test_calendar_preserves_end_time_without_publishing_production_notes(): void
    {
        $job = $this->project();
        $day = $this->postJson('/api/jobs/'.$job->id.'/production-days', $this->payload(['date' => now()->toDateString(), 'notes' => 'PRIVATE_DAY_CANARY']))->assertCreated()->json('data');
        $this->getJson('/api/calendar?from='.now()->toDateString().'&to='.now()->toDateString())->assertOk()->assertJsonPath('data.0.meta.end_time', '18:00');
        $this->patchJson('/api/calendar/move', ['source' => 'session', 'source_id' => $day['id'], 'date' => now()->toDateString(), 'time' => '20:00'])->assertUnprocessable();
        $this->assertSame('09:00', substr(Session::find($day['id'])->time, 0, 5));
        $user = User::find($job->user_id);
        $this->get('/api/public/calendar/'.$user->calendar_token)->assertOk()->assertSee('DTEND:'.now()->format('Ymd').'T180000Z')->assertDontSee('PRIVATE_DAY_CANARY');
    }
}
