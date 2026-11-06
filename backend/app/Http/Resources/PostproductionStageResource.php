<?php

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostproductionStageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->checklists->flatMap->items;
        $done = $this->tasks->whereIn('status', ['completed', 'cancelled'])->count() + $items->where('is_completed', true)->count();
        $total = $this->tasks->count() + $items->count();

        return [
            ...$this->resource->only(['id', 'job_id', 'key', 'label', 'status', 'assigned_user_id', 'notes', 'position', 'revision']),
            'due_date' => $this->due_date?->toDateString(),
            'progress' => $total ? (int) round($done / $total * 100) : ($this->status === 'completed' ? 100 : 0),
            'pending_tasks' => $this->tasks->whereIn('status', Task::OPEN_STATUSES)->count(),
            'tasks' => TaskResource::collection($this->tasks), 'checklists' => ChecklistResource::collection($this->checklists),
        ];
    }
}
