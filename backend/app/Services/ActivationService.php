<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\Session;
use App\Models\User;

class ActivationService
{
    public function forUser(User $user): array
    {
        $steps = [
            $this->step('studio', 'Configura tu estudio', $user->onboarding_completed_at !== null, '/onboarding'),
            $this->step('client', 'Añade tu primer cliente', $user->clients()->exists(), '/app/clients'),
            $this->step('job', 'Crea tu primer trabajo', $user->jobs()->exists() || $user->deliveries()->exists(), '/app/jobs'),
            $this->step('bookings', 'Activa tus reservas', $user->bookings_enabled_at !== null, '/app/booking-requests'),
            $this->step('session', 'Crea tu primera sesión', $user->sessions()->exists(), '/app/sessions'),
        ];

        $completedWork = Delivery::query()
            ->ownedBy($user->id)
            ->whereIn('status', ['delivered', 'approved'])
            ->exists() || Session::query()->ownedBy($user->id)->where('status', 'delivered')->exists();
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
}
