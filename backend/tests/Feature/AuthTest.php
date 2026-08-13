<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_returns_a_token_and_persists_the_user(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Alex',
            'email' => 'alex@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'email_verified', 'onboarding_completed'], 'token'])
            ->assertJsonPath('user.email_verified', false)
            ->assertJsonPath('user.onboarding_completed', false)
            ->assertJsonPath('verification_email_sent', true);

        $this->assertDatabaseHas('users', ['email' => 'alex@example.com']);
        Notification::assertSentTo(User::query()->find($response->json('user.id')), VerifyEmail::class);
    }

    public function test_registration_never_exposes_the_password_hash(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Alex',
            'email' => 'alex@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $this->assertArrayNotHasKey('password', $response->json('user'));
    }

    public function test_registration_rejects_weak_and_duplicated_credentials(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/register', [
            'name' => 'Alex',
            'email' => 'taken@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_returns_a_token_with_valid_credentials(): void
    {
        User::factory()->create(['email' => 'alex@example.com', 'password' => Hash::make('password123')]);

        $this->postJson('/api/login', ['email' => 'alex@example.com', 'password' => 'password123'])
            ->assertOk()
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'alex@example.com', 'password' => Hash::make('password123')]);

        $this->postJson('/api/login', ['email' => 'alex@example.com', 'password' => 'nope'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_login_does_not_reveal_whether_the_email_exists(): void
    {
        User::factory()->create(['email' => 'alex@example.com', 'password' => Hash::make('password123')]);

        $existing = $this->postJson('/api/login', ['email' => 'alex@example.com', 'password' => 'nope']);
        $missing = $this->postJson('/api/login', ['email' => 'ghost@example.com', 'password' => 'nope']);

        $this->assertSame($existing->json('errors'), $missing->json('errors'));
    }

    public function test_login_invalidates_previously_issued_tokens(): void
    {
        $user = User::factory()->create(['email' => 'alex@example.com', 'password' => Hash::make('password123')]);
        $stale = $user->createToken('old')->plainTextToken;

        $this->postJson('/api/login', ['email' => 'alex@example.com', 'password' => 'password123'])->assertOk();

        $this->withToken($stale)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $user = User::factory()->create(['email' => 'alex@example.com', 'password' => Hash::make('password123')]);
        $token = $this->postJson('/api/login', ['email' => 'alex@example.com', 'password' => 'password123'])->json('token');

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        // El guard de Sanctum cachea el usuario resuelto dentro del mismo test,
        // asi que la revocacion se comprueba en la tabla de tokens.
        $this->assertSame(0, $user->tokens()->count());
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_protected_endpoints_reject_anonymous_requests(): void
    {
        foreach (['/api/user', '/api/dashboard', '/api/sessions', '/api/tasks', '/api/system'] as $endpoint) {
            $this->getJson($endpoint)->assertUnauthorized();
        }
    }

    public function test_login_is_rate_limited(): void
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->postJson('/api/login', ['email' => 'alex@example.com', 'password' => 'nope']);
        }

        $this->postJson('/api/login', ['email' => 'alex@example.com', 'password' => 'nope'])
            ->assertStatus(429);
    }

    public function test_signed_verification_link_marks_email_and_redirects_to_frontend(): void
    {
        $user = User::factory()->unverified()->withoutOnboarding()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
            'id' => $user->id,
            'hash' => sha1($user->email),
        ]);

        $this->get($url)
            ->assertRedirect(rtrim((string) config('app.frontend_url'), '/').'/verify-email?verified=1');

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_verification_link_rejects_an_invalid_signature(): void
    {
        $user = User::factory()->unverified()->create();

        $this->get("/api/email/verify/{$user->id}/".sha1($user->email))
            ->assertForbidden();

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_user_can_request_another_verification_email(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->withoutOnboarding()->create();
        $token = $user->createToken('frontend')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/email/verification-notification')
            ->assertAccepted();

        Notification::assertSentTo($user, VerifyEmail::class);
    }
}
