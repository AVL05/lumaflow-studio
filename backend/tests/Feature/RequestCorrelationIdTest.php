<?php

namespace Tests\Feature;

use App\Http\Middleware\RequestCorrelationId;
use Tests\TestCase;

class RequestCorrelationIdTest extends TestCase
{
    public function test_generates_an_id_when_missing(): void
    {
        $response = $this->getJson('/api/ready');

        $response->assertOk();
        $requestId = $response->headers->get('X-Request-ID');

        $this->assertNotEmpty($requestId);
        $this->assertMatchesRegularExpression(
            '/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/',
            $requestId
        );
    }

    public function test_keeps_a_valid_incoming_id(): void
    {
        $response = $this->getJson('/api/ready', ['X-Request-ID' => 'abc-123_XYZ:.9']);

        $response->assertOk();
        $this->assertSame('abc-123_XYZ:.9', $response->headers->get('X-Request-ID'));
    }

    public function test_replaces_an_invalid_id(): void
    {
        foreach (['<script>alert(1)</script>', str_repeat('x', 101), "a b\nc", '../etc/passwd/../'] as $bad) {
            $response = $this->getJson('/api/ready', ['X-Request-ID' => $bad]);

            $response->assertOk();
            $this->assertNotSame($bad, $response->headers->get('X-Request-ID'));
            $this->assertNotEmpty($response->headers->get('X-Request-ID'));
        }
    }

    public function test_middleware_does_not_break_routes(): void
    {
        $this->getJson('/api/health')->assertOk();
        $this->getJson('/api/ready')->assertOk();
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_resolve_rules(): void
    {
        $this->assertSame('abc', RequestCorrelationId::resolve('abc'));
        $this->assertNotSame('', RequestCorrelationId::resolve(''));
        $this->assertNotSame(str_repeat('x', 101), RequestCorrelationId::resolve(str_repeat('x', 101)));
    }

    public function test_observability_is_disabled_without_dsn(): void
    {
        $this->assertEmpty(config('sentry.dsn'));

        // Sin proveedor la app responde con normalidad.
        $this->getJson('/api/ready')->assertOk();
        $this->getJson('/api/health')->assertOk();
    }
}
