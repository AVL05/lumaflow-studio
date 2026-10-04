<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Job;
use App\Models\Quote;
use App\Models\User;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContractTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Client $client;

    private Job $job;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create();
        $this->client = Client::create(['user_id' => $this->owner->id, 'name' => 'Novios', 'status' => 'active']);
        $this->job = Job::create([
            'user_id' => $this->owner->id,
            'client_id' => $this->client->id,
            'title' => 'Boda',
            'specialty' => 'general',
            'workflow_key' => 'general',
            'status' => 'lead',
            'contract_status' => 'not_required',
        ]);
        Sanctum::actingAs($this->owner);
    }

    private function draftPayload(array $overrides = []): array
    {
        return [
            'job_id' => $this->job->id,
            'client_id' => $this->client->id,
            'title' => 'Contrato de servicios fotográficos',
            'content' => "# Servicio\n\nCobertura completa.\n",
            ...$overrides,
        ];
    }

    private function createDraft(array $overrides = []): array
    {
        return $this->postJson('/api/contracts', $this->draftPayload($overrides))
            ->assertCreated()->json('data');
    }

    public function test_contract_is_created_in_the_current_workspace(): void
    {
        $contract = $this->createDraft();

        $this->assertStringStartsWith('CON-', $contract['contract_number']);
        $this->assertSame('draft', $contract['status']);
        $this->assertSame(1, $contract['version']);

        $stored = Contract::query()->find($contract['id']);

        $this->assertSame((int) $this->owner->current_workspace_id, (int) $stored->workspace_id);
        $this->assertSame($this->owner->id, (int) $stored->user_id);
    }

    public function test_content_is_generated_from_job_and_quote_when_missing(): void
    {
        $quote = Quote::create([
            'user_id' => $this->owner->id,
            'client_id' => $this->client->id,
            'job_id' => $this->job->id,
            'quote_number' => 'PRE-2026-0001',
            'issue_date' => now()->toDateString(),
            'subtotal' => '500.00',
            'tax_rate' => 21,
            'tax_amount' => '105.00',
            'total' => '605.00',
        ]);

        $payload = $this->draftPayload(['quote_id' => $quote->id]);
        unset($payload['content']);

        $contract = $this->postJson('/api/contracts', $payload)->assertCreated()->json('data');

        $this->assertStringContainsString('Boda', $contract['content']);
        $this->assertStringContainsString('Novios', $contract['content']);
        $this->assertStringContainsString('No constituye asesoramiento jurídico', $contract['content']);
        $this->assertSame($quote->id, $contract['quote_id']);
    }

    public function test_member_accesses_contract_and_outsider_gets_404(): void
    {
        $contract = $this->createDraft();
        $workspaceId = (int) $this->owner->refresh()->current_workspace_id;

        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($member);
        $this->getJson("/api/contracts/{$contract['id']}")->assertOk();
        $this->getJson('/api/contracts')->assertOk();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/contracts/{$contract['id']}")->assertNotFound();
        // Con IDs ajenos la validacion scoped falla sin filtrar existencia.
        $this->putJson("/api/contracts/{$contract['id']}", $this->draftPayload())->assertUnprocessable();
        $this->deleteJson("/api/contracts/{$contract['id']}")->assertNotFound();
    }

    public function test_cross_workspace_parties_are_rejected(): void
    {
        $foreign = User::factory()->create();
        $foreignClient = Client::create(['user_id' => $foreign->id, 'name' => 'Ajeno', 'status' => 'active']);

        // Cliente de otro workspace: el exists scoped falla sin filtrar.
        $this->postJson('/api/contracts', $this->draftPayload(['client_id' => $foreignClient->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('client_id');

        // Trabajo de otro workspace con cliente propio: incoherencia 422.
        $foreignJob = Job::create([
            'user_id' => $foreign->id,
            'client_id' => $foreignClient->id,
            'title' => 'Ajeno',
            'specialty' => 'general',
            'workflow_key' => 'general',
            'status' => 'lead',
            'contract_status' => 'not_required',
        ]);

        $response = $this->postJson('/api/contracts', $this->draftPayload(['job_id' => $foreignJob->id]));
        $this->assertContains($response->status(), [404, 422]);

        // Cliente distinto al del trabajo dentro del mismo workspace.
        $otherClient = Client::create(['user_id' => $this->owner->id, 'name' => 'Otro', 'status' => 'active']);
        $this->postJson('/api/contracts', $this->draftPayload(['client_id' => $otherClient->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('client_id');
    }

    public function test_lifecycle_transitions_and_terminals(): void
    {
        $contract = $this->createDraft();

        // draft -> accepted directo no permitido.
        $this->patchJson("/api/contracts/{$contract['id']}/status", ['status' => 'accepted'])
            ->assertUnprocessable();

        $this->patchJson("/api/contracts/{$contract['id']}/status", ['status' => 'sent'])
            ->assertOk()
            ->assertJsonPath('data.status', 'sent')
            ->assertJsonPath('data.version', 2);
        $this->assertNotNull(Contract::query()->find($contract['id'])->content_snapshot);

        // sent -> accepted: espejo legacy y traza.
        $this->patchJson("/api/contracts/{$contract['id']}/status", ['status' => 'accepted'])
            ->assertOk()->assertJsonPath('data.status', 'accepted');

        $stored = Contract::query()->find($contract['id']);
        $this->assertNotNull($stored->accepted_at);
        $this->assertSame('signed', $stored->job->refresh()->contract_status);
        $this->assertNotNull($stored->job->contract_signed_at);

        // Terminal protegido: ni reject ni edicion ni borrado.
        $this->patchJson("/api/contracts/{$contract['id']}/status", ['status' => 'rejected'])
            ->assertUnprocessable();
        $this->putJson("/api/contracts/{$contract['id']}", $this->draftPayload(['title' => 'Cambio']))
            ->assertUnprocessable();
        $this->deleteJson("/api/contracts/{$contract['id']}")->assertUnprocessable();

        $this->assertDatabaseHas('activities', [
            'subject_type' => Contract::class,
            'subject_id' => $contract['id'],
            'type' => 'created',
        ]);
        $this->assertDatabaseHas('activities', [
            'subject_type' => Contract::class,
            'subject_id' => $contract['id'],
            'type' => 'status_changed',
        ]);
    }

    public function test_sent_rejected_and_expired_paths(): void
    {
        foreach (['rejected', 'expired'] as $terminal) {
            $job = Job::create([
                'user_id' => $this->owner->id,
                'client_id' => $this->client->id,
                'title' => "Trabajo {$terminal}",
                'specialty' => 'general',
                'workflow_key' => 'general',
                'status' => 'lead',
                'contract_status' => 'not_required',
            ]);
            $contract = $this->createDraft(['job_id' => $job->id, 'title' => "Contrato {$terminal}"]);
            $this->patchJson("/api/contracts/{$contract['id']}/status", ['status' => 'sent'])->assertOk();
            $this->patchJson("/api/contracts/{$contract['id']}/status", ['status' => $terminal])
                ->assertOk()->assertJsonPath('data.status', $terminal);
        }

        $rejected = Contract::query()->where('title', 'Contrato rejected')->first();
        $this->assertNotNull($rejected->rejected_at);
        $this->assertSame('declined', $rejected->job->refresh()->contract_status);
    }

    public function test_sent_contract_locks_content_but_allows_expiry(): void
    {
        $contract = $this->createDraft();
        $this->patchJson("/api/contracts/{$contract['id']}/status", ['status' => 'sent'])->assertOk();

        $this->putJson("/api/contracts/{$contract['id']}", $this->draftPayload(['title' => 'Otro título']))
            ->assertUnprocessable();

        $payload = $this->draftPayload();
        $payload['expires_at'] = now()->addMonth()->toDateString();
        $this->putJson("/api/contracts/{$contract['id']}", $payload)
            ->assertOk()->assertJsonPath('data.expires_at', now()->addMonth()->toDateString());

        // El snapshot queda estable aunque el trabajo cambie despues.
        $snapshot = Contract::query()->find($contract['id'])->content_snapshot;
        $this->assertSame("# Servicio\n\nCobertura completa.", $snapshot);
        $this->job->update(['title' => 'Boda renombrada']);
        $this->assertSame(
            $snapshot,
            Contract::query()->find($contract['id'])->content_snapshot
        );
    }

    public function test_draft_is_editable_and_deletable(): void
    {
        $contract = $this->createDraft();

        $this->putJson("/api/contracts/{$contract['id']}", $this->draftPayload(['title' => 'Contrato v2']))
            ->assertOk()->assertJsonPath('data.title', 'Contrato v2');

        $this->deleteJson("/api/contracts/{$contract['id']}")->assertNoContent();
        $this->assertNull(Contract::query()->find($contract['id']));
    }

    public function test_validation_rejects_invalid_input(): void
    {
        // IDs inexistentes.
        $this->postJson('/api/contracts', $this->draftPayload(['job_id' => 999999]))
            ->assertUnprocessable()->assertJsonValidationErrors('job_id');

        // HTML peligroso.
        $this->postJson('/api/contracts', $this->draftPayload(['content' => '<script>alert(1)</script>']))
            ->assertUnprocessable()->assertJsonValidationErrors('content');

        // Status arbitrario.
        $contract = $this->createDraft();
        $this->patchJson("/api/contracts/{$contract['id']}/status", ['status' => 'signed'])
            ->assertUnprocessable();

        // Caducidad pasada.
        $this->postJson('/api/contracts', $this->draftPayload(['expires_at' => now()->subDay()->toDateString()]))
            ->assertUnprocessable()->assertJsonValidationErrors('expires_at');
    }

    public function test_job_cannot_be_deleted_with_contracts(): void
    {
        $this->createDraft();

        $this->deleteJson("/api/jobs/{$this->job->id}")->assertUnprocessable();
    }

    public function test_job_detail_includes_contracts(): void
    {
        $contract = $this->createDraft();

        $this->getJson("/api/jobs/{$this->job->id}")
            ->assertOk()
            ->assertJsonPath('data.contracts.0.id', $contract['id'])
            ->assertJsonPath('data.contracts.0.contract_number', $contract['contract_number']);
    }
}
