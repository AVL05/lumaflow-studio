<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Job;
use App\Models\User;
use Database\Seeders\ShowcaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use RuntimeException;
use Tests\TestCase;

class ShowcaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_a_complete_fictitious_studio_through_the_api(): void
    {
        $this->seed(ShowcaseSeeder::class);

        $owner = User::query()->where('email', ShowcaseSeeder::EMAIL)->firstOrFail();
        $this->assertSame(16, Job::query()->where('user_id', $owner->id)->count());
        $this->assertSame(0, Client::query()->where('user_id', $owner->id)->where('email', 'not like', '%@example.test')->count());
        $this->assertTrue(Invoice::query()->where('user_id', $owner->id)->where('status', 'overdue')->exists());

        Sanctum::actingAs($owner);
        $this->getJson('/api/dashboard')->assertOk()->assertJsonPath('data.totalClients', 11);
        $analytics = $this->getJson('/api/analytics?from='.now()->subYear()->toDateString().'&to='.now()->toDateString())->assertOk();
        $this->assertGreaterThan(0, $analytics->json('data.kpis.revenue'));
        $this->getJson('/api/jobs')->assertOk()->assertJsonPath('data.0.status', fn (string $status) => ! in_array($status, Job::FINISHED_STATUSES, true));
    }

    public function test_running_it_twice_leaves_the_studio_unchanged(): void
    {
        $this->seed(ShowcaseSeeder::class);
        $this->seed(ShowcaseSeeder::class);

        $this->assertSame(1, User::query()->where('email', ShowcaseSeeder::EMAIL)->count());
        $this->assertSame(16, Job::query()->count());
    }

    public function test_it_refuses_to_run_in_production(): void
    {
        $this->app->detectEnvironment(fn () => 'production');

        // Called directly: `db:seed` would first stop at its production prompt.
        try {
            $this->app->make(ShowcaseSeeder::class)->run();
            $this->fail('The showcase seeder must not run in production.');
        } catch (RuntimeException) {
            $this->assertSame(0, User::query()->count());
        }
    }
}
