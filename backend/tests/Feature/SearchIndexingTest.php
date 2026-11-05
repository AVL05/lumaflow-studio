<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class SearchIndexingTest extends TestCase
{
    use RefreshDatabase;

    public function test_unknown_public_identifiers_return_private_non_indexable_404s_without_debug_details(): void
    {
        config(['app.debug' => false]);
        foreach (['deliveries', 'contracts', 'studios', 'calendar'] as $resource) {
            $response = $this->getJson("/api/public/{$resource}/synthetic-nonexistent");
            $response->assertNotFound()
                ->assertHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet')
                ->assertHeader('Referrer-Policy', 'no-referrer');
            $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
            $response->assertJsonMissingPath('exception')->assertJsonMissingPath('trace');
        }
    }

    public function test_api_authentication_errors_remain_401_and_non_indexable(): void
    {
        $this->getJson('/api/clients')->assertUnauthorized()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet');
    }

    public function test_successful_api_responses_also_exclude_indexing(): void
    {
        $this->getJson('/api/health')->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet');
    }

    public function test_unexpected_failures_stay_500_without_exposing_or_indexing_the_exception(): void
    {
        config(['app.debug' => false]);
        Route::get('/api/synthetic-indexing-error', fn () => throw new \RuntimeException('PRIVATE_CANARY'));
        $response = $this->getJson('/api/synthetic-indexing-error')->assertStatus(500)
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet');
        $this->assertStringNotContainsString('PRIVATE_CANARY', $response->getContent());
    }
}
