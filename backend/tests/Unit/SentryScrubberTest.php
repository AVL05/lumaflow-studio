<?php

namespace Tests\Unit;

use App\Support\SentryScrubber;
use PHPUnit\Framework\TestCase;

class SentryScrubberTest extends TestCase
{
    public function test_scrubs_sensitive_headers(): void
    {
        $event = SentryScrubber::scrub([
            'request' => ['headers' => [
                'authorization' => 'Bearer secret',
                'cookie' => 'session=abc',
                'set-cookie' => 'x',
                'x-xsrf-token' => 't',
                'x-csrf-token' => 't',
                'content-type' => 'application/json',
            ]],
        ]);

        $this->assertSame(['content-type' => 'application/json'], $event['request']['headers']);
    }

    public function test_removes_bodies_and_scrubs_public_token_urls(): void
    {
        $event = SentryScrubber::scrub([
            'request' => [
                'url' => 'https://api.example.com/api/public/contracts/secret-token-123',
                'data' => ['password' => 'x'],
            ],
            'breadcrumbs' => ['values' => [
                ['data' => ['url' => 'https://app.example.com/deliver/abc']],
                ['data' => ['message' => 'hola', 'input' => 'x']],
            ]],
        ]);

        $this->assertStringNotContainsString('secret-token-123', $event['request']['url']);
        $this->assertStringContainsString('[REDACTED]', $event['request']['url']);
        $this->assertArrayNotHasKey('data', $event['request']);
        $this->assertStringNotContainsString('abc', $event['breadcrumbs']['values'][0]['data']['url']);
        $this->assertArrayNotHasKey('message', $event['breadcrumbs']['values'][1]['data']);
    }

    public function test_keeps_safe_urls_and_minimal_user(): void
    {
        $event = SentryScrubber::scrub([
            'request' => ['url' => 'https://api.example.com/api/clients?page=2'],
            'user' => ['id' => 7, 'email' => 'a@b.c', 'name' => 'Ana'],
        ]);

        $this->assertSame('https://api.example.com/api/clients?page=2', $event['request']['url']);
        $this->assertSame(['id' => 7], $event['user']);
    }

    public function test_scrubs_nested_body_fields(): void
    {
        $scrubbed = SentryScrubber::scrubBody([
            'title' => 'Boda',
            'email' => 'a@b.c',
            'nested' => ['prompt' => 'secreto', 'safe' => 'ok'],
            'content' => 'hola',
        ]);

        $this->assertSame('Boda', $scrubbed['title']);
        $this->assertSame('[REDACTED]', $scrubbed['email']);
        $this->assertSame('[REDACTED]', $scrubbed['nested']['prompt']);
        $this->assertSame('ok', $scrubbed['nested']['safe']);
        $this->assertSame('[REDACTED]', $scrubbed['content']);
    }
}
