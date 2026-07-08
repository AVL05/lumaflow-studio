<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChecklistReorderRequest;
use App\Http\Requests\ChecklistRequest;
use App\Http\Resources\ChecklistResource;
use App\Models\Checklist;
use App\Services\ChecklistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ChecklistController extends Controller
{
    public function __construct(private readonly ChecklistService $checklists) {}

    public function index(): AnonymousResourceCollection
    {
        $checklists = Checklist::query()
            ->ownedBy(request()->user()->id)
            ->with('items')
            ->withCount(['items', 'completedItems'])
            ->when(request('session_id'), fn ($query) => $query->where('session_id', request('session_id')))
            ->when(request('type'), fn ($query) => $query->where('type', request('type')))
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return ChecklistResource::collection($checklists);
    }

    public function store(ChecklistRequest $request): ChecklistResource
    {
        $checklist = $this->checklists->createWithTemplate($request->user()->id, $request->validated());

        return new ChecklistResource($this->hydrate($checklist));
    }

    public function show(Checklist $checklist): ChecklistResource
    {
        $this->authorizeOwnership('view', $checklist);

        return new ChecklistResource($this->hydrate($checklist));
    }

    public function update(ChecklistRequest $request, Checklist $checklist): ChecklistResource
    {
        $this->authorizeOwnership('update', $checklist);
        $checklist->update($request->safe()->only(['name', 'type', 'session_id']));

        return new ChecklistResource($this->hydrate($checklist->refresh()));
    }

    public function destroy(Checklist $checklist): mixed
    {
        $this->authorizeOwnership('delete', $checklist);
        $checklist->delete();

        return response()->noContent();
    }

    public function duplicate(Checklist $checklist): ChecklistResource
    {
        $this->authorizeOwnership('view', $checklist);

        return new ChecklistResource($this->hydrate($this->checklists->duplicate($checklist->load('items'))));
    }

    public function reorder(ChecklistReorderRequest $request, Checklist $checklist): ChecklistResource
    {
        $this->authorizeOwnership('update', $checklist);
        $this->checklists->reorderItems($checklist, $request->validated('items'));

        return new ChecklistResource($this->hydrate($checklist->refresh()));
    }

    public function templates(): JsonResponse
    {
        return response()->json(['data' => ChecklistService::TEMPLATES]);
    }

    private function hydrate(Checklist $checklist): Checklist
    {
        return $checklist->load('items')->loadCount(['items', 'completedItems']);
    }
}
