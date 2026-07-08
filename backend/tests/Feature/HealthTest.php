<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\OllamaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    private function fakeOllama(bool $available): void
    {
        $this->mock(OllamaService::class, function ($mock) use ($available): void {
            $mock->shouldReceive('status')->andReturn([
                'available' => $available,
                'url' => 'http://127.0.0.1:11434',
                'model' => 'llama3.1',
                'models' => [],
                'error' => $available ? null : 'unreachable',
            ]);
        });
    }

    public function test_health_is_public_and_reports_every_dependency(): void
    {
        $this->fakeOllama(true);

        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'up')
            ->assertJsonStructure(['status', 'timestamp', 'checks' => ['api', 'database', 'storage', 'cache', 'ollama']]);
    }

    public function test_health_degrades_but_stays_up_when_ollama_is_unreachable(): void
    {
        $this->fakeOllama(false);

        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'degraded')
            ->assertJsonPath('checks.ollama.status', 'degraded')
            ->assertJsonPath('checks.database.status', 'up');
    }

    public function test_public_health_does_not_leak_internal_details(): void
    {
        $this->fakeOllama(true);

        $checks = $this->getJson('/api/health')->assertOk()->json('checks');

        foreach ($checks as $check) {
            $this->assertSame(['status'], array_keys($check));
        }
    }

    public function test_system_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/system')->assertUnauthorized();
    }

    public function test_system_endpoint_exposes_details_to_authenticated_users(): void
    {
        $this->fakeOllama(true);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/system')
            ->assertOk()
            ->assertJsonPath('data.checks.ollama.model', 'llama3.1')
            ->assertJsonStructure(['data' => ['checks' => ['database' => ['driver', 'latency_ms']]]]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
