<?php

namespace Tests\Unit;

use App\Support\SentryScrubber;
use PHPUnit\Framework\TestCase;
use Sentry\Breadcrumb;
use Sentry\Event;
use Sentry\ExceptionDataBag;
use Sentry\UserDataBag;

class SentryScrubberTest extends TestCase
{
    public function test_native_sdk_event_keeps_exception_type_without_private_content(): void
    {
        $event = Event::createEvent();
        $event->setMessage('MESSAGE_CANARY');
        $event->setRequest(['url' => 'https://example.test/contract/TOKEN_CANARY?signature=QUERY_CANARY', 'data' => ['secret' => 'BODY_CANARY']]);
        $event->setExceptions([new ExceptionDataBag(new \RuntimeException('EXCEPTION_CANARY'))]);
        $event->setUser(new UserDataBag(7, 'EMAIL_CANARY@example.test'));
        $event->setExtra(['payload' => 'EXTRA_CANARY']);
        $event->setBreadcrumb([new Breadcrumb('error', 'default', 'log', 'CRUMB_CANARY', ['token' => 'DATA_CANARY'])]);
        $clean = SentryScrubber::scrubSdkEvent($event);
        $this->assertSame('RuntimeException', $clean->getExceptions()[0]->getType());
        $this->assertSame('[REDACTED]', $clean->getExceptions()[0]->getValue());
        $this->assertNull($clean->getUser()->getEmail());
        $this->assertSame(7, $clean->getUser()->getId());
        $this->assertSame([], $clean->getExtra());
        $this->assertNull($clean->getBreadcrumbs()[0]->getMessage());
        $this->assertStringNotContainsString('CANARY', json_encode($clean->getRequest()));
    }

    public function test_exception_payloads_query_credentials_and_case_insensitive_headers_are_removed(): void
    {
        $clean = SentryScrubber::scrub([
            'message' => 'MESSAGE_CANARY',
            'extra' => ['private' => 'EXTRA_CANARY'],
            'exception' => ['values' => [['type' => 'RuntimeException', 'value' => 'EXCEPTION_CANARY', 'stacktrace' => ['frames' => [['filename' => 'app.php', 'lineno' => 12, 'vars' => ['secret' => 'VARS_CANARY']]]]]]],
            'request' => ['headers' => ['AUTHORIZATION' => 'HEADER_CANARY'], 'url' => 'https://user:PASS_CANARY@example.test/api/public/deliveries/PATH_CANARY?signature=QUERY_CANARY#HASH_CANARY', 'query_string' => 'QUERY_CANARY', 'cookies' => ['a' => 'COOKIE_CANARY']],
            'breadcrumbs' => ['values' => [['message' => 'BREADCRUMB_CANARY', 'data' => ['token' => 'DATA_CANARY']]]],
        ]);
        $this->assertStringNotContainsString('CANARY', json_encode($clean));
        $this->assertSame('RuntimeException', $clean['exception']['values'][0]['type']);
        $this->assertSame(12, $clean['exception']['values'][0]['stacktrace']['frames'][0]['lineno']);
    }

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
