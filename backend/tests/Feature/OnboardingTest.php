<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_user_can_complete_onboarding(): void
    {
        $user = User::factory()->withoutOnboarding()->create();

        $this->actingAs($user)
            ->postJson('/api/onboarding', [
                'studio_name' => 'Norte Estudio',
                'photography_specialties' => ['wedding', 'portrait'],
                'country' => 'ES',
                'currency' => 'EUR',
                'onboarding_goal' => 'organize_sessions',
            ])
            ->assertOk()
            ->assertJsonPath('data.studio_name', 'Norte Estudio')
            ->assertJsonPath('data.studio_slug', 'norte-estudio')
            ->assertJsonPath('data.photography_specialties', ['wedding', 'portrait'])
            ->assertJsonPath('data.onboarding_completed', true);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'studio_name' => 'Norte Estudio',
            'country' => 'ES',
            'currency' => 'EUR',
            'onboarding_goal' => 'organize_sessions',
        ]);
    }

    public function test_unverified_user_cannot_complete_onboarding(): void
    {
        $user = User::factory()->unverified()->withoutOnboarding()->create();

        $this->actingAs($user)
            ->postJson('/api/onboarding', $this->validPayload())
            ->assertForbidden();
    }

    public function test_dashboard_requires_completed_onboarding(): void
    {
        $user = User::factory()->withoutOnboarding()->create();

        $this->actingAs($user)
            ->getJson('/api/dashboard')
            ->assertStatus(409)
            ->assertJsonPath('code', 'onboarding_required');
    }

    public function test_onboarding_validates_specialties_currency_and_goal(): void
    {
        $user = User::factory()->withoutOnboarding()->create();

        $this->actingAs($user)
            ->postJson('/api/onboarding', [
                'studio_name' => 'Norte Estudio',
                'photography_specialties' => ['invalid'],
                'country' => 'ESP',
                'currency' => 'BTC',
                'onboarding_goal' => 'unknown',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'photography_specialties.0',
                'country',
                'currency',
                'onboarding_goal',
            ]);
    }

    private function validPayload(): array
    {
        return [
            'studio_name' => 'Norte Estudio',
            'photography_specialties' => ['portrait'],
            'country' => 'ES',
            'currency' => 'EUR',
            'onboarding_goal' => 'organize_sessions',
        ];
    }
}
