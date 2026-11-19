<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_api_responses_carry_security_headers(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        // Otro middleware (portales publicos) puede fijar una politica mas estricta.
        $this->assertContains($response->headers->get('Referrer-Policy'), ['strict-origin-when-cross-origin', 'no-referrer']);
        $this->assertNotEmpty($response->headers->get('Permissions-Policy'));
    }

    public function test_error_responses_also_carry_security_headers(): void
    {
        $this->getJson('/api/does-not-exist')
            ->assertNotFound()
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_hsts_is_only_sent_over_https(): void
    {
        $this->getJson('/api/health')->assertHeaderMissing('Strict-Transport-Security');

        $this->getJson('https://localhost/api/health')
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_hsts_is_sent_behind_a_tls_terminating_proxy(): void
    {
        $this->getJson('/api/health', ['X-Forwarded-Proto' => 'https'])
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
}
