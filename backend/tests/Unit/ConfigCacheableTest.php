<?php

namespace Tests\Unit;

use Tests\TestCase;

class ConfigCacheableTest extends TestCase
{
    /** `config:cache` (usado en produccion) falla si algun valor de config es una closure. */
    public function test_configuration_can_be_serialized_for_config_cache(): void
    {
        $this->assertNotFalse(var_export(config()->all(), true));

        $this->assertTrue(is_callable(config('sentry.before_send')));
        $this->assertIsNotObject(config('sentry.before_send'));
    }
}
