<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TokenExpirationTest extends TestCase
{
    use RefreshDatabase;

    public function test_expired_token_is_rejected_with_401(): void
    {
        config(['sanctum.expiration' => 60]);
        $user = User::factory()->create();
        $token = $user->createToken('frontend')->plainTextToken;

        $this->withToken($token)->getJson('/api/user')->assertOk();

        $this->travel(61)->minutes();
        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_token_without_expiration_config_stays_valid(): void
    {
        config(['sanctum.expiration' => null]);
        $user = User::factory()->create();
        $token = $user->createToken('frontend')->plainTextToken;

        $this->travel(400)->days();

        $this->withToken($token)->getJson('/api/user')->assertOk();
    }

    public function test_prune_command_deletes_only_expired_tokens(): void
    {
        config(['sanctum.expiration' => 60]);
        $user = User::factory()->create();
        $old = $user->createToken('old')->accessToken;
        $this->travel(3)->days();
        $fresh = $user->createToken('fresh')->accessToken;

        $this->artisan('sanctum:prune-expired', ['--hours' => 24])->assertSuccessful();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $old->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $fresh->id]);
    }
}
