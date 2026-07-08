<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChecklistItemRequest;
use App\Http\Resources\ChecklistItemResource;
use App\Models\Checklist;
use App\Models\ChecklistItem;
use App\Services\ActivityLogger;
use App\Services\ChecklistService;
use Illuminate\Http\Request;

class ChecklistItemController extends Controller
{
    public function __construct(
        private readonly ChecklistService $checklists,
        private readonly ActivityLogger $activity,
    ) {}

    public function store(ChecklistItemRequest $request, Checklist $checklist): ChecklistItemResource
    {
        $this->authorizeOwnership('update', $checklist);

        $item = $checklist->items()->create([
            ...$request->validated(),
            'position' => (int) $checklist->items()->max('position') + 1,
        ]);

        return new ChecklistItemResource($item);
    }

    public function update(ChecklistItemRequest $request, ChecklistItem $item): ChecklistItemResource
    {
        $this->authorizeOwnership('update', $item->load('checklist'));
        $item->update($request->validated());

        return new ChecklistItemResource($item->refresh());
    }

    public function toggle(Request $request, ChecklistItem $item): ChecklistItemResource
    {
        $this->authorizeOwnership('update', $item->load('checklist'));

        $completed = $request->boolean('is_completed', ! $item->is_completed);
        $this->checklists->toggleItem($item, $completed);
        $this->logIfChecklistCompleted($request, $item);

        return new ChecklistItemResource($item);
    }

    public function destroy(ChecklistItem $item): mixed
    {
        $this->authorizeOwnership('delete', $item->load('checklist'));
        $item->delete();

        return response()->noContent();
    }

    /** Deja rastro en el timeline de la sesion cuando una checklist llega al 100%. */
    private function logIfChecklistCompleted(Request $request, ChecklistItem $item): void
    {
        $checklist = $item->checklist;
        $pending = $checklist->items()->where('is_completed', false)->count();

        if ($pending > 0 || ! $checklist->session_id) {
            return;
        }

        $this->activity->log(
            $request->user(),
            $checklist->session,
            ActivityLogger::CHECKLIST_COMPLETED,
            "Checklist completada: {$checklist->name}",
            ['checklist_id' => $checklist->id],
        );
    }
}
