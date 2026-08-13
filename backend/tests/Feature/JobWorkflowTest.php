<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class JobWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->client = Client::create(['user_id' => $this->user->id, 'name' => 'Laura y Carlos', 'status' => 'active']);
        Sanctum::actingAs($this->user);
    }

    public function test_wedding_job_creates_specialized_workflow_and_unified_view(): void
    {
        $job = $this->postJson('/api/jobs', [
            'client_id' => $this->client->id,
            'title' => 'Boda Laura + Carlos',
            'specialty' => 'wedding',
            'workflow_key' => 'wedding',
            'status' => 'lead',
            'event_date' => now()->addMonth()->toDateString(),
            'budget' => 2400,
            'deposit_amount' => 600,
            'contract_status' => 'not_required',
            'create_workflow_tasks' => true,
        ])->assertCreated()->json('data');

        $this->assertSame('Boda Laura + Carlos', $job['title']);
        $this->assertCount(5, $job['tasks']);
        $this->assertSame('Reunión de descubrimiento', $job['tasks'][0]['title']);
        $this->getJson("/api/jobs/{$job['id']}")->assertOk()
            ->assertJsonPath('data.client.name', 'Laura y Carlos')
            ->assertJsonCount(5, 'data.tasks');
    }

    public function test_commercial_events_advance_job_without_regressions(): void
    {
        $job = Job::create([
            'user_id' => $this->user->id, 'client_id' => $this->client->id,
            'title' => 'Retrato editorial', 'specialty' => 'portrait', 'workflow_key' => 'portrait', 'status' => 'lead',
        ]);
        $quote = $this->postJson('/api/quotes', [
            'job_id' => $job->id, 'client_id' => $this->client->id, 'tax_rate' => 21,
            'items' => [['description' => 'Sesión', 'quantity' => 1, 'unit_price' => 500]],
        ])->assertCreated()->json('data');

        $this->patchJson("/api/quotes/{$quote['id']}/status", ['status' => 'accepted'])->assertOk();
        $this->assertDatabaseHas('photography_jobs', ['id' => $job->id, 'status' => 'contract_pending', 'contract_status' => 'draft']);

        $invoice = $this->postJson('/api/invoices', ['quote_id' => $quote['id']])->assertCreated()->json('data');
        $this->patchJson("/api/invoices/{$invoice['id']}/status", ['status' => 'paid'])->assertOk();
        $this->assertDatabaseHas('photography_jobs', ['id' => $job->id, 'status' => 'confirmed']);

        $this->patchJson("/api/quotes/{$quote['id']}/status", ['status' => 'sent'])->assertOk();
        $this->assertDatabaseHas('photography_jobs', ['id' => $job->id, 'status' => 'confirmed']);
    }

    public function test_foreign_jobs_are_hidden_and_foreign_relations_are_rejected(): void
    {
        $foreign = User::factory()->create();
        $foreignJob = Job::create(['user_id' => $foreign->id, 'title' => 'Trabajo ajeno', 'specialty' => 'general', 'workflow_key' => 'general']);

        $this->getJson("/api/jobs/{$foreignJob->id}")->assertNotFound();
        $this->putJson("/api/jobs/{$foreignJob->id}", [])->assertNotFound();
        $this->postJson('/api/sessions', [
            'job_id' => $foreignJob->id, 'name' => 'Sesión', 'date' => now()->toDateString(),
            'session_type' => 'portrait', 'status' => 'planned',
        ])->assertUnprocessable()->assertJsonValidationErrors('job_id');
    }
}
