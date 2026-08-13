<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OnboardingService
{
    public function complete(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data): User {
            $user->forceFill([
                'studio_name' => $data['studio_name'],
                'studio_slug' => $this->uniqueStudioSlug($data['studio_name'], $user->id),
                'photography_specialties' => $data['photography_specialties'],
                'country' => mb_strtoupper($data['country']),
                'currency' => mb_strtoupper($data['currency']),
                'onboarding_goal' => $data['onboarding_goal'],
                'onboarding_completed_at' => now(),
            ])->save();

            return $user->refresh();
        });
    }

    private function uniqueStudioSlug(string $studioName, int $userId): string
    {
        $base = Str::slug($studioName) ?: 'studio';
        $slug = $base;
        $suffix = 1;

        while (User::query()->where('studio_slug', $slug)->whereKeyNot($userId)->exists()) {
            $slug = $base.'-'.(++$suffix);
        }

        return $slug;
    }
}
