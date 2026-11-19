<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TwoFactorAuthTest extends TestCase
{
    use RefreshDatabase;

    private TwoFactorService $twoFactor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->twoFactor = app(TwoFactorService::class);
    }

    /** Activa el 2FA para el usuario y devuelve [secreto, codigos de recuperacion]. */
    private function enable(User $user): array
    {
        Sanctum::actingAs($user);
        $secret = $this->postJson('/api/two-factor/setup')->assertOk()->json('secret');
        $codes = $this->postJson('/api/two-factor/confirm', ['code' => $this->twoFactor->codeAt($secret, time())])
            ->assertOk()
            ->json('recovery_codes');

        return [$secret, $codes];
    }

    public function test_totp_matches_the_rfc_6238_test_vector(): void
    {
        // RFC 6238 (SHA-1, secreto ASCII "12345678901234567890"): 94287082, 07081804 y 14050471
        // truncados a 6 digitos.
        $secret = TwoFactorService::base32Encode('12345678901234567890');

        $this->assertSame('287082', $this->twoFactor->codeAt($secret, 59));
        $this->assertSame('081804', $this->twoFactor->codeAt($secret, 1111111109));
        $this->assertSame('050471', $this->twoFactor->codeAt($secret, 1111111111));
    }

    public function test_base32_roundtrip(): void
    {
        $raw = random_bytes(20);

        $this->assertSame($raw, TwoFactorService::base32Decode(TwoFactorService::base32Encode($raw)));
    }

    public function test_setup_and_confirm_activate_two_factor_and_return_recovery_codes(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $setup = $this->postJson('/api/two-factor/setup')->assertOk();
        $this->assertStringStartsWith('otpauth://totp/', $setup->json('otpauth_uri'));
        $this->assertNull($user->fresh()->two_factor_confirmed_at);

        $this->postJson('/api/two-factor/confirm', ['code' => '000000'])->assertUnprocessable();
        $this->assertNull($user->fresh()->two_factor_confirmed_at);

        $confirm = $this->postJson('/api/two-factor/confirm', ['code' => $this->twoFactor->codeAt($setup->json('secret'), time())])->assertOk();

        $this->assertCount(8, $confirm->json('recovery_codes'));
        $this->assertNotNull($user->fresh()->two_factor_confirmed_at);
        $this->getJson('/api/user')->assertJsonPath('data.two_factor_enabled', true);
    }

    public function test_secret_is_encrypted_at_rest_and_never_serialized(): void
    {
        $user = User::factory()->create();
        [$secret] = $this->enable($user);

        $raw = DB::table('users')->where('id', $user->id)->value('two_factor_secret');

        $this->assertNotSame($secret, $raw);
        $this->assertStringNotContainsString($secret, json_encode($user->fresh()->toArray()));
        $this->assertStringNotContainsString($secret, $this->getJson('/api/user')->getContent());
    }

    public function test_login_without_code_asks_for_it_and_issues_no_token(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass-123']);
        $this->enable($user);
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass-123'])
            ->assertUnprocessable()
            ->assertJsonPath('two_factor_required', true)
            ->assertJsonMissingPath('token');
    }

    public function test_login_with_valid_totp_succeeds_and_the_code_cannot_be_replayed(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass-123']);
        [$secret] = $this->enable($user);
        $this->app['auth']->forgetGuards();

        $code = $this->twoFactor->codeAt($secret, time() + 30);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass-123', 'code' => $code])
            ->assertOk()
            ->assertJsonStructure(['token', 'user']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass-123', 'code' => $code])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }

    public function test_wrong_code_or_wrong_password_never_logs_in(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass-123']);
        $this->enable($user);
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass-123', 'code' => '123456'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'otra-clave', 'code' => '123456'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_recovery_code_logs_in_once_only(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass-123']);
        [, $codes] = $this->enable($user);
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass-123', 'code' => $codes[0]])->assertOk();
        $this->assertSame(7, $this->twoFactor->remainingRecoveryCodes($user->fresh()));

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass-123', 'code' => $codes[0]])
            ->assertUnprocessable();
    }

    public function test_accounts_without_two_factor_log_in_as_before(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass-123']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-pass-123'])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_disabling_requires_password_and_a_valid_code(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass-123']);
        [$secret] = $this->enable($user);
        $code = $this->twoFactor->codeAt($secret, time() + 30);

        $this->postJson('/api/two-factor/disable', ['password' => 'mala', 'code' => $code])->assertUnprocessable();
        $this->postJson('/api/two-factor/disable', ['password' => 'secret-pass-123', 'code' => '000000'])->assertUnprocessable();
        $this->assertNotNull($user->fresh()->two_factor_confirmed_at);

        $this->postJson('/api/two-factor/disable', ['password' => 'secret-pass-123', 'code' => $code])->assertOk();

        $fresh = $user->fresh();
        $this->assertNull($fresh->two_factor_confirmed_at);
        $this->assertNull($fresh->two_factor_secret);
    }

    public function test_endpoints_require_authentication(): void
    {
        $this->postJson('/api/two-factor/setup')->assertUnauthorized();
        $this->postJson('/api/two-factor/confirm', ['code' => '123456'])->assertUnauthorized();
        $this->postJson('/api/two-factor/disable')->assertUnauthorized();
    }
}
