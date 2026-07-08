<?php

namespace Tests\Unit;

use App\Models\Task;
use App\Models\User;
use App\Policies\TaskPolicy;
use PHPUnit\Framework\TestCase;

class OwnedResourcePolicyTest extends TestCase
{
    private function user(int $id): User
    {
        $user = new User;
        $user->id = $id;

        return $user;
    }

    private function taskOf(int $userId): Task
    {
        return new Task(['user_id' => $userId]);
    }

    public function test_owner_can_view_update_and_delete(): void
    {
        $policy = new TaskPolicy;
        $user = $this->user(1);
        $task = $this->taskOf(1);

        $this->assertTrue($policy->view($user, $task));
        $this->assertTrue($policy->update($user, $task));
        $this->assertTrue($policy->delete($user, $task));
    }

    public function test_non_owner_is_denied_on_every_ability(): void
    {
        $policy = new TaskPolicy;
        $user = $this->user(1);
        $task = $this->taskOf(2);

        $this->assertFalse($policy->view($user, $task));
        $this->assertFalse($policy->update($user, $task));
        $this->assertFalse($policy->delete($user, $task));
    }

    public function test_ownership_comparison_is_not_loose(): void
    {
        $policy = new TaskPolicy;
        $user = $this->user(1);
        $task = new Task(['user_id' => '1']);

        // user_id puede llegar como string desde la BD: la comparacion castea a int.
        $this->assertTrue($policy->update($user, $task));
    }

    public function test_listing_and_creating_are_always_allowed(): void
    {
        $policy = new TaskPolicy;

        $this->assertTrue($policy->viewAny($this->user(1)));
        $this->assertTrue($policy->create($this->user(1)));
    }
}
