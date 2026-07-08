<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReminderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $time = $this->remind_time ? substr($this->remind_time, 0, 5) : null;

        return [
            'id' => $this->id,
            'remindable_type' => $this->remindable_type ? strtolower(class_basename($this->remindable_type)) : null,
            'remindable_id' => $this->remindable_id,
            'remind_date' => $this->remind_date?->toDateString(),
            'remind_time' => $time,
            'remind_at' => $this->remind_date?->toDateString().($time ? ' '.$time : ''),
            'message' => $this->message,
            'type' => $this->type,
            'status' => $this->status,
            'is_due' => $this->status === 'pending' && $this->remind_date?->isBefore(now()->startOfDay()->addDay()),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
