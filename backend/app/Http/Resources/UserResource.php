<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified' => $this->hasVerifiedEmail(),
            'studio_name' => $this->studio_name,
            'studio_slug' => $this->studio_slug,
            'calendar_token' => $this->calendar_token,
            'photography_specialties' => $this->photography_specialties ?? [],
            'country' => $this->country,
            'currency' => $this->currency,
            'onboarding_goal' => $this->onboarding_goal,
            'onboarding_completed' => $this->onboarding_completed_at !== null,
            'getting_started_choice' => $this->getting_started_choice,
            'getting_started_completed' => $this->getting_started_completed_at !== null,
            'sample_workspace_activated' => $this->sample_workspace_activated_at !== null,
            'bookings_enabled' => $this->bookings_enabled_at !== null,
        ];
    }
}
