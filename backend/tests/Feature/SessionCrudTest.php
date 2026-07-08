<?php

namespace Tests\Feature;

use App\Models\Session;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SessionCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Editorial urbano',
            'date' => '2026-08-01',
            'session_type' => 'urban',
            'status' => 'planned',
            ...$overrides,
        ];
    }

    private function foreignSession(): Session
    {
        return Session::create([
            'user_id' => User::factory()->create()->id,
            'name' => 'Ajena',
            'date' => '2026-08-01',
            'session_type' => 'portrait',
            'status' => 'planned',
        ]);
    }

    public function test_index_only_lists_sessions_of_the_authenticated_user(): void
    {
        Session::create([...$this->payload(), 'user_id' => $this->user->id]);
        $this->foreignSession();

        $this->getJson('/api/sessions')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Editorial urbano');
    }

    public function test_store_attaches_the_session_to_the_authenticated_user(): void
    {
        $id = $this->postJson('/api/sessions', $this->payload())->assertCreated()->json('data.id');

        $this->assertDatabaseHas('sessions', ['id' => $id, 'user_id' => $this->user->id]);
    }

    public function test_store_validates_the_payload(): void
    {
        $this->postJson('/api/sessions', ['name' => '', 'status' => 'inventado'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'date', 'status']);
    }

    public function test_show_update_and_destroy_work_for_the_owner(): void
    {
        $id = $this->postJson('/api/sessions', $this->payload())->json('data.id');

        $this->getJson("/api/sessions/{$id}")->assertOk()->assertJsonPath('data.id', $id);

        $this->putJson("/api/sessions/{$id}", $this->payload(['name' => 'Renombrada']))
            ->assertOk()
            ->assertJsonPath('data.name', 'Renombrada');

        $this->deleteJson("/api/sessions/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('sessions', ['id' => $id]);
    }

    public function test_foreign_sessions_answer_404_instead_of_403(): void
    {
        $foreign = $this->foreignSession();

        // 403 confirmaria que el recurso existe; el proyecto responde 404 siempre.
        $this->getJson("/api/sessions/{$foreign->id}")->assertNotFound();
        $this->putJson("/api/sessions/{$foreign->id}", $this->payload())->assertNotFound();
        $this->deleteJson("/api/sessions/{$foreign->id}")->assertNotFound();

        $this->assertDatabaseHas('sessions', ['id' => $foreign->id]);
    }

    public function test_search_and_status_filters_apply(): void
    {
        Session::create([...$this->payload(['name' => 'Boda Ana']), 'user_id' => $this->user->id]);
        Session::create([...$this->payload(['name' => 'Producto', 'status' => 'editing']), 'user_id' => $this->user->id]);

        $this->getJson('/api/sessions?search=Boda')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/sessions?status=editing')->assertOk()->assertJsonPath('data.0.name', 'Producto');
    }
}
