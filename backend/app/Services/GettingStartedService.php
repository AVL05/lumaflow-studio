<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class GettingStartedService
{
    public function __construct(private readonly SampleWorkspaceService $sampleWorkspace) {}

    public function complete(User $user, string $choice): User
    {
        return DB::transaction(function () use ($user, $choice): User {
            if ($choice === 'sample_workspace') {
                $user = $this->sampleWorkspace->activate($user);
            }

            $user->forceFill([
                'getting_started_choice' => $choice,
                'getting_started_completed_at' => now(),
            ])->save();

            return $user->refresh();
        });
    }
}
