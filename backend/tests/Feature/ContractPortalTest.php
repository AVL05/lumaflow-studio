<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Contract;
use App\Models\ContractPortalLink;
use App\Models\Job;
use App\Models\Notification;
use App\Models\User;
use App\Models\WorkspaceMembership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContractPortalTest extends TestCase
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

    private function createContract(array $overrides = []): array
    {
        return $this->postJson('/api/contracts', [
            'job_id' => $this->job->id,
            'client_id' => $this->client->id,
            'title' => 'Contrato de servicios',
            'content' => "# Servicio\n\nCobertura.\n",
            ...$overrides,
        ])->assertCreated()->json('data');
    }

    private function sendContract(int $id): void
    {
        $this->patchJson("/api/contracts/{$id}/status", ['status' => 'sent'])->assertOk();
    }

    private function generateLink(int $id): array
    {
        return $this->postJson("/api/contracts/{$id}/portal")->assertCreated()->json();
    }

    public function test_portal_link_stores_only_hash_and_shows_token_once(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $payload = $this->generateLink($contract['id']);

        $this->assertArrayHasKey('token', $payload['meta']);
        $this->assertSame(64, strlen($payload['meta']['token']));

        $link = ContractPortalLink::query()->where('contract_id', $contract['id'])->first();

        $this->assertNotNull($link);
        $this->assertSame(hash('sha256', $payload['meta']['token']), $link->token_hash);
        $this->assertNotNull($link->expires_at);

        // El estado interno nunca expone el token.
        $this->getJson("/api/contracts/{$contract['id']}/portal")
            ->assertOk()
            ->assertJsonMissing(['token' => $payload['meta']['token']]);
    }

    public function test_public_view_shows_only_the_linked_contract(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $other = $this->createContract(['title' => 'Otro contrato']);
        $token = $this->generateLink($contract['id'])['meta']['token'];

        $view = $this->getJson("/api/public/contracts/{$token}")->assertOk()->json('data');

        $this->assertSame($contract['contract_number'], $view['contract_number']);
        $this->assertSame('sent', $view['status']);
        $this->assertStringContainsString('Cobertura', $view['content']);
        $this->assertSame('Novios', $view['client_name']);

        $this->assertArrayNotHasKey('workspace_id', $view);
        $this->assertArrayNotHasKey('user_id', $view);
        $this->assertArrayNotHasKey('client_id', $view);
        $this->assertArrayNotHasKey('job_id', $view);
        $this->assertArrayNotHasKey('token', $view);
        $this->assertArrayNotHasKey('client_message', $view);
        $this->assertStringNotContainsString($other['contract_number'], json_encode($view));
        $this->assertStringNotContainsString($other['title'], json_encode($view));
    }

    public function test_unknown_revoked_expired_and_draft_links_are_uniform_404(): void
    {
        $this->getJson('/public/contracts/'.str_repeat('a', 64))->assertNotFound();

        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $token = $this->generateLink($contract['id'])['meta']['token'];

        $link = ContractPortalLink::query()->where('contract_id', $contract['id'])->first();
        $link->forceFill(['expires_at' => now()->subDay()])->saveQuietly();
        $this->getJson("/api/public/contracts/{$token}")->assertNotFound();

        $link->forceFill(['expires_at' => now()->addMonth(), 'revoked_at' => now()])->saveQuietly();
        $this->getJson("/api/public/contracts/{$token}")->assertNotFound();

        $draft = $this->createContract(['title' => 'Borrador sin enviar']);
        $draftToken = $this->postJson("/api/contracts/{$draft['id']}/portal")
            ->assertUnprocessable()->json();
        $this->assertNotNull($draftToken);
    }

    public function test_accept_flow_with_idempotency_notification_and_activity(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $token = $this->generateLink($contract['id'])['meta']['token'];

        $first = $this->postJson("/api/public/contracts/{$token}/accept")
            ->assertOk()->json();

        $this->assertSame('accepted', $first['data']['status']);
        $this->assertFalse($first['meta']['already_processed']);

        $second = $this->postJson("/api/public/contracts/{$token}/accept")
            ->assertOk()->json();

        $this->assertSame('accepted', $second['data']['status']);
        $this->assertTrue($second['meta']['already_processed']);

        // Una sola actividad de cambio y una sola notificacion.
        $this->assertSame(1, Activity::query()
            ->where('subject_type', Contract::class)
            ->where('subject_id', $contract['id'])
            ->where('type', 'status_changed')
            ->where('description', 'Estado sent -> accepted')->count());
        $this->assertSame(1, Notification::query()
            ->where('user_id', $this->owner->id)
            ->where('title', 'Contrato aceptado por el cliente')->count());

        $stored = Contract::query()->find($contract['id']);
        $this->assertNotNull($stored->accepted_at);
        $this->assertNotNull($stored->client_responded_at);
    }

    public function test_reject_flow_with_optional_comment(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $token = $this->generateLink($contract['id'])['meta']['token'];

        $rejected = $this->postJson("/api/public/contracts/{$token}/reject", [
            'message' => '¿Podemos mover la fecha? <b>Gracias</b>',
        ])->assertOk()->json();

        $this->assertSame('rejected', $rejected['data']['status']);
        $this->assertFalse($rejected['meta']['already_processed']);

        $stored = Contract::query()->find($contract['id']);
        $this->assertSame('¿Podemos mover la fecha? Gracias', $stored->client_message);
        $this->assertNotNull($stored->client_responded_at);

        $this->assertSame(1, Notification::query()
            ->where('user_id', $this->owner->id)
            ->where('title', 'El cliente ha rechazado el contrato')->count());

        // Segundo rechazo coherente sin duplicar notificacion.
        $again = $this->postJson("/api/public/contracts/{$token}/reject")->assertOk()->json();
        $this->assertTrue($again['meta']['already_processed']);
        $this->assertSame(1, Notification::query()
            ->where('user_id', $this->owner->id)
            ->where('title', 'El cliente ha rechazado el contrato')->count());

        // El comentario es visible internamente.
        $this->getJson("/api/contracts/{$contract['id']}")
            ->assertOk()
            ->assertJsonPath('data.client_message', '¿Podemos mover la fecha? Gracias');
    }

    public function test_reject_comment_too_long_is_rejected(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $token = $this->generateLink($contract['id'])['meta']['token'];

        $this->postJson("/api/public/contracts/{$token}/reject", ['message' => str_repeat('x', 2001)])
            ->assertUnprocessable();
    }

    public function test_regeneration_invalidates_previous_token(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $first = $this->generateLink($contract['id'])['meta']['token'];

        $second = $this->postJson("/api/contracts/{$contract['id']}/portal/regenerate")
            ->assertOk()->json()['meta']['token'];

        $this->assertNotSame($first, $second);
        $this->getJson("/api/public/contracts/{$first}")->assertNotFound();
        $this->getJson("/api/public/contracts/{$second}")->assertOk();
    }

    public function test_revocation_blocks_portal_without_changing_status(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $token = $this->generateLink($contract['id'])['meta']['token'];
        $this->getJson("/api/public/contracts/{$token}")->assertOk();

        $this->deleteJson("/api/contracts/{$contract['id']}/portal")->assertNoContent();

        $this->getJson("/api/public/contracts/{$token}")->assertNotFound();
        $this->postJson("/api/public/contracts/{$token}/accept")->assertNotFound();
        $this->postJson("/api/public/contracts/{$token}/reject")->assertNotFound();

        $this->assertSame('sent', Contract::query()->find($contract['id'])->status);
    }

    public function test_terminal_contract_shows_final_read_state(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $token = $this->generateLink($contract['id'])['meta']['token'];
        $this->postJson("/api/public/contracts/{$token}/accept")->assertOk();

        $view = $this->getJson("/api/public/contracts/{$token}")->assertOk()->json('data');
        $this->assertSame('accepted', $view['status']);
        $this->assertNotNull($view['decided_at']);

        $this->postJson("/api/public/contracts/{$token}/reject", ['message' => 'Tarde'])
            ->assertUnprocessable();
    }

    public function test_workspace_member_manages_link_and_outsider_gets_404(): void
    {
        $contract = $this->createContract();
        $this->sendContract($contract['id']);
        $workspaceId = (int) $this->owner->refresh()->current_workspace_id;

        $member = User::factory()->create();
        WorkspaceMembership::create([
            'workspace_id' => $workspaceId, 'user_id' => $member->id, 'role' => WorkspaceMembership::ROLE_MEMBER,
        ]);

        Sanctum::actingAs($member);
        $this->getJson("/api/contracts/{$contract['id']}/portal")->assertOk();
        $token = $this->postJson("/api/contracts/{$contract['id']}/portal")
            ->assertCreated()->json()['meta']['token'];
        $this->getJson("/api/public/contracts/{$token}")->assertOk();
        $this->deleteJson("/api/contracts/{$contract['id']}/portal")->assertNoContent();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/contracts/{$contract['id']}/portal")->assertNotFound();
        $this->postJson("/api/contracts/{$contract['id']}/portal")->assertNotFound();
    }
}
