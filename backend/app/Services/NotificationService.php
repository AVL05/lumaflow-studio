<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function push(User $user, string $type, string $title, ?string $message = null, ?string $link = null): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => in_array($type, Notification::TYPES, true) ? $type : 'info',
            'title' => $title,
            'message' => $message,
            'link' => $link,
        ]);
    }

    public function success(User $user, string $title, ?string $message = null, ?string $link = null): Notification
    {
        return $this->push($user, 'success', $title, $message, $link);
    }

    public function warning(User $user, string $title, ?string $message = null, ?string $link = null): Notification
    {
        return $this->push($user, 'warning', $title, $message, $link);
    }

    public function info(User $user, string $title, ?string $message = null, ?string $link = null): Notification
    {
        return $this->push($user, 'info', $title, $message, $link);
    }

    public function system(User $user, string $title, ?string $message = null, ?string $link = null): Notification
    {
        return $this->push($user, 'system', $title, $message, $link);
    }

    public function unreadCount(User $user): int
    {
        return Notification::query()->ownedBy($user->id)->unread()->count();
    }
}
