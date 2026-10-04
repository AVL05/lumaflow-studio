<?php

namespace Tests\Feature;

use App\Models\AiConversation;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\Location;
use App\Models\Quote;
use App\Models\Session;
use App\Models\Task;
use App\Models\User;
use App\Services\AnalyticsCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnalyticsCacheTest extends TestCase
{
    use RefreshDatabase;

    private function seedBasics(User $user): void
    {
        $client = Client::create(['user_id' => $user->id, 'name' => 'Ana', 'status' => 'active']);
        Session::create([
            'user_id' => $user->id, 'client_id' => $client->id, 'name' => 'Boda',
            'date' => now()->toDateString(), 'session_type' => 'wedding', 'status' => 'confirmed',
        ]);
        Delivery::create([
            'user_id' => $user->id, 'client_id' => $client->id, 'title' => 'Galeria',
            'status' => 'delivered', 'budget' => 100, 'delivery_date' => now()->toDateString(),
        ]);
        Task::create(['user_id' => $user->id, 'title' => 'Editar', 'status' => 'todo', 'priority' => 'medium']);
    }

    private function countQueries(callable $run): int
    {
        $count = 0;
        DB::listen(function () use (&$count): void {
            $count++;
        });

        $run();

        return $count;
    }

    private function analyticsUrl(): string
    {
        return '/api/analytics?from='.now()->subMonth()->toDateString().'&to='.now()->toDateString();
    }

    public function test_miss_computes_and_hit_skips_aggregates(): void
    {
        $user = User::factory()->create();
        $this->seedBasics($user);
        Sanctum::actingAs($user);

        $firstQueries = $this->countQueries(fn () => $this->getJson($this->analyticsUrl())->assertOk());
        $first = $this->getJson($this->analyticsUrl())->assertOk()->json('data');

        $this->assertTrue(Cache::has(AnalyticsCache::keyFor(
            $user, now()->subMonth()->toDateString(), now()->toDateString()
        )));

        $secondQueries = $this->countQueries(fn () => $this->getJson($this->analyticsUrl())->assertOk());
        $second = $this->getJson($this->analyticsUrl())->assertOk()->json('data');

        $this->assertSame($first, $second);
        $this->assertGreaterThan(20, $firstQueries);
        $this->assertLessThanOrEqual(6, $secondQueries);
    }

    public function test_client_create_update_and_delete_invalidate(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->getJson($this->analyticsUrl())->assertOk();

        $client = Client::create(['user_id' => $user->id, 'name' => 'Bruno', 'status' => 'active']);
        $active = $this->getJson($this->analyticsUrl())->assertOk()->json('data.kpis.activeClients');
        $this->assertSame(1, $active);

        $client->update(['status' => 'inactive']);
        $byStatus = $this->getJson($this->analyticsUrl())->assertOk()->json('data.clientsByStatus');
        $this->assertSame([], array_values(array_filter($byStatus, fn ($row) => $row['label'] === 'active')));

        $client->delete();
        $gone = $this->getJson($this->analyticsUrl())->assertOk()->json('data.kpis.activeClients');
        $this->assertSame(0, $gone);
    }

    public function test_session_task_delivery_and_location_mutations_invalidate(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->getJson($this->analyticsUrl())->assertOk()->json('data');

        $client = Client::create(['user_id' => $user->id, 'name' => 'Ana', 'status' => 'active']);
        Session::create([
            'user_id' => $user->id, 'client_id' => $client->id, 'name' => 'Boda',
            'date' => now()->toDateString(), 'session_type' => 'wedding', 'status' => 'confirmed',
        ]);
        Task::create(['user_id' => $user->id, 'title' => 'T', 'status' => 'todo', 'priority' => 'medium']);
        Delivery::create([
            'user_id' => $user->id, 'client_id' => $client->id, 'title' => 'G',
            'status' => 'pending', 'delivery_date' => now()->toDateString(),
        ]);
        Location::create(['user_id' => $user->id, 'name' => 'Estudio', 'city' => 'Madrid', 'latitude' => 40.41, 'longitude' => -3.70, 'type' => 'interior']);
        AiConversation::create(['user_id' => $user->id, 'title' => 'Charla', 'status' => 'open']);

        $fresh = $this->getJson($this->analyticsUrl())->assertOk()->json('data');

        $this->assertSame(1, $fresh['kpis']['sessions']);
        $this->assertSame(1, $fresh['kpis']['openTasks']);
        $this->assertSame(1, count($fresh['topLocations']));
        $this->assertSame(1, array_sum(array_column($fresh['aiUsage'], 'conversations')));
    }

    public function test_quote_mutation_does_not_invalidate(): void
    {
        $user = User::factory()->create();
        $this->seedBasics($user);
        Sanctum::actingAs($user);
        $before = $this->getJson($this->analyticsUrl())->assertOk()->json('data');

        Quote::create([
            'user_id' => $user->id, 'client_id' => $user->clients()->first()->id,
            'quote_number' => 'PRE-2026-0001', 'issue_date' => now()->toDateString(),
            'subtotal' => '100.00', 'tax_rate' => 21, 'tax_amount' => '21.00', 'total' => '121.00',
        ]);

        $queries = $this->countQueries(fn () => $this->getJson($this->analyticsUrl())->assertOk());
        $after = $this->getJson($this->analyticsUrl())->assertOk()->json('data');

        $this->assertSame($before, $after);
        $this->assertLessThanOrEqual(6, $queries);
    }

    public function test_workspaces_never_share_cache(): void
    {
        $ownerA = User::factory()->create();
        $ownerB = User::factory()->create();
        Client::create(['user_id' => $ownerA->id, 'name' => 'Solo A', 'status' => 'active']);

        Sanctum::actingAs($ownerA);
        $dataA = $this->getJson($this->analyticsUrl())->assertOk()->json('data');

        Sanctum::actingAs($ownerB);
        $dataB = $this->getJson($this->analyticsUrl())->assertOk()->json('data');

        $this->assertNotSame(
            AnalyticsCache::keyFor($ownerA, now()->subMonth()->toDateString(), now()->toDateString()),
            AnalyticsCache::keyFor($ownerB, now()->subMonth()->toDateString(), now()->toDateString())
        );
        $this->assertSame(1, $dataA['kpis']['activeClients']);
        $this->assertSame(0, $dataB['kpis']['activeClients']);

        // Mutar A invalida A pero B sigue servido desde su cache.
        Sanctum::actingAs($ownerA);
        Client::create(['user_id' => $ownerA->id, 'name' => 'Otro A', 'status' => 'active']);
        $refreshedA = $this->getJson($this->analyticsUrl())->assertOk()->json('data');
        $this->assertSame(2, $refreshedA['kpis']['activeClients']);

        Sanctum::actingAs($ownerB);
        $queriesB = $this->countQueries(fn () => $this->getJson($this->analyticsUrl())->assertOk());
        $stillB = $this->getJson($this->analyticsUrl())->assertOk()->json('data');
        $this->assertSame(0, $stillB['kpis']['activeClients']);
        $this->assertLessThanOrEqual(6, $queriesB);
    }

    public function test_cache_expires_after_ttl(): void
    {
        config(['analytics.cache_ttl' => 1]);

        $user = User::factory()->create();
        $this->seedBasics($user);
        Sanctum::actingAs($user);

        $this->getJson($this->analyticsUrl())->assertOk();
        $this->assertTrue(Cache::has(AnalyticsCache::keyFor(
            $user, now()->subMonth()->toDateString(), now()->toDateString()
        )));

        $this->travel(2)->seconds();

        $queries = $this->countQueries(fn () => $this->getJson($this->analyticsUrl())->assertOk());
        $this->assertGreaterThan(20, $queries);
    }
}
