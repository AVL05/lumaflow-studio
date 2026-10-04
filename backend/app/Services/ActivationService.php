<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Delivery;
use App\Models\Job;
use App\Models\Session;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivationService
{
    /**
     * Checklist de activacion con estado real persistido (Issue #6).
     *
     * Los pasos de dominio solo cuentan recursos reales del workspace
     * (`is_demo = false`): los datos de ejemplo nunca completan progreso.
     * El alcance es por membership, coherente con el resto del panel.
     */
    public function forUser(User $user): array
    {
        $steps = [
            $this->step('studio', 'Configura tu estudio', $user->onboarding_completed_at !== null, '/onboarding'),
            $this->step('client', 'Añade tu primer cliente', $this->hasReal($user, Client::class), '/app/clients'),
            $this->step('job', 'Crea tu primer trabajo', $this->hasReal($user, Job::class), '/app/jobs'),
            $this->step('bookings', 'Activa tus reservas', $user->bookings_enabled_at !== null, '/app/booking-requests'),
            $this->step('session', 'Crea tu primera sesión', $this->hasReal($user, Session::class), '/app/sessions'),
        ];

        $completedWork = Delivery::query()
            ->accessibleBy($user)
            ->whereIn('status', ['delivered', 'approved'])
            ->exists() || Session::query()->accessibleBy($user)->where('status', 'delivered')->exists();
        $bookingReady = $user->bookings_enabled_at !== null;

        return [
            'completed' => collect($steps)->where('completed', true)->count(),
            'total' => count($steps),
            'steps' => $steps,
            'sample_workspace_activated' => $user->sample_workspace_activated_at !== null,
            'operational' => $completedWork || $bookingReady,
            'operational_milestone' => $completedWork ? 'completed_work' : ($bookingReady ? 'booking_link' : null),
            'booking_url' => $bookingReady ? rtrim(config('app.frontend_url'), '/')."/book/{$user->studio_slug}" : null,
        ];
    }

    public function enableBookings(User $user): User
    {
        if (! $user->bookings_enabled_at) {
            $user->forceFill(['bookings_enabled_at' => now()])->save();
        }

        return $user->refresh();
    }

    private function step(string $key, string $label, bool $completed, string $href): array
    {
        return compact('key', 'label', 'completed', 'href');
    }

    /** @param class-string<Model> $model */
    private function hasReal(User $user, string $model): bool
    {
        return $model::query()->accessibleBy($user)->where('is_demo', false)->exists();
    }
}
