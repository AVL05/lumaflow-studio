<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'studio_name' => fn (array $attributes) => $attributes['name'],
            'photography_specialties' => ['portrait'],
            'country' => 'ES',
            'currency' => 'EUR',
            'onboarding_goal' => 'organize_sessions',
            'onboarding_completed_at' => now(),
            'getting_started_choice' => 'existing_account',
            'getting_started_completed_at' => now(),
            'bookings_enabled_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withoutOnboarding(): static
    {
        return $this->state(fn (array $attributes) => [
            'studio_name' => null,
            'photography_specialties' => null,
            'country' => null,
            'currency' => null,
            'onboarding_goal' => null,
            'onboarding_completed_at' => null,
            'getting_started_choice' => null,
            'getting_started_completed_at' => null,
            'sample_workspace_activated_at' => null,
            'bookings_enabled_at' => null,
        ]);
    }

    public function withoutGettingStarted(): static
    {
        return $this->state(fn (array $attributes) => [
            'getting_started_choice' => null,
            'getting_started_completed_at' => null,
            'sample_workspace_activated_at' => null,
            'bookings_enabled_at' => null,
        ]);
    }
}
