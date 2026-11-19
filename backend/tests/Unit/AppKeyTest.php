<?php

namespace Tests\Unit;

use App\Support\AppKey;
use Illuminate\Encryption\Encrypter;
use PHPUnit\Framework\TestCase;

class AppKeyTest extends TestCase
{
    public function test_bare_base64_key_from_render_gets_the_prefix_and_is_usable(): void
    {
        $bare = base64_encode(random_bytes(32)); // 44 chars, what generateValue produces

        $normalized = AppKey::normalize($bare);

        $this->assertSame('base64:'.$bare, $normalized);
        $this->assertTrue(Encrypter::supported(base64_decode(substr($normalized, 7)), 'AES-256-CBC'));
    }

    public function test_prefixed_raw_and_empty_keys_are_left_untouched(): void
    {
        $prefixed = 'base64:'.base64_encode(random_bytes(32));
        $raw = random_bytes(16).random_bytes(16);

        $this->assertSame($prefixed, AppKey::normalize($prefixed));
        $this->assertSame($raw, AppKey::normalize($raw));
        $this->assertNull(AppKey::normalize(null));
        $this->assertSame('', AppKey::normalize(''));
    }

    public function test_values_that_are_not_a_32_byte_key_are_not_rewritten(): void
    {
        $this->assertSame('not-a-key', AppKey::normalize('not-a-key'));
        $this->assertSame(base64_encode('short'), AppKey::normalize(base64_encode('short')));
    }
}
