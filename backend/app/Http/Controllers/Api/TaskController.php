<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\ActivityLogger;
use App\Services\NotificationService;
use App\Services\TaskSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaskController extends Controller
{
    public function __construct(
        private readonly ActivityLogger $activity,
        private readonly NotificationService $notifications,
        private readonly TaskSummaryService $summaries,
    ) {}

    /** Totales agregados para las tarjetas de la pagina de tareas. */
    public function summary(): JsonResponse
    {
        return response()->json(['data' => $this->summaries->forUser(request()->user()->id)]);
    }

    public function index(): AnonymousResourceCollection
    {
        $sort = in_array(request('sort'), ['due_date', 'priority', 'status', 'title', 'created_at', 'position'], true) ? request('sort') : 'due_date';
        $direction = request('direction') === 'desc' ? 'desc' : 'asc';

        $tasks = Task::query()
            ->ownedBy(request()->user()->id)
            ->with(['session:id,name', 'client:id,name'])
            ->search(request('search'))
            ->status(request('status'))
            ->priority(request('priority'))
            ->between(request('due_from'), request('due_to'))
            ->when(request('session_id'), fn ($query) => $query->where('session_id', request('session_id')))
            ->when(request('client_id'), fn ($query) => $query->where('client_id', request('client_id')))
            ->when(request('open') === '1', fn ($query) => $query->open())
            ->orderByRaw('due_date is null')
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate(min((int) request('per_page', 15), 60));

        return TaskResource::collection($tasks);
    }

    public function store(TaskRequest $request): TaskResource
    {
        $task = $request->user()->tasks()->create($this->payload($request->validated()));
        $this->activity->log($request->user(), $task, ActivityLogger::CREATED, "Tarea creada: {$task->title}");

        return new TaskResource($task->load(['session:id,name', 'client:id,name']));
    }

    public function show(Task $task): TaskResource
    {
        $this->authorizeOwnership('view', $task);

        return new TaskResource($task->load(['session:id,name', 'client:id,name']));
    }

    public function update(TaskRequest $request, Task $task): TaskResource
    {
        $this->authorizeOwnership('update', $task);

        $previous = $task->status;
        $task->update($this->payload($request->validated()));
        $this->activity->logStatusChange($request->user(), $task, $previous, $task->status);

        if ($previous !== 'completed' && $task->status === 'completed') {
            $this->notifications->success($request->user(), 'Tarea completada', $task->title, '/app/tasks');
        }

        return new TaskResource($task->refresh()->load(['session:id,name', 'client:id,name']));
    }

    public function destroy(Task $task): mixed
    {
        $this->authorizeOwnership('delete', $task);
        $task->delete();

        return response()->noContent();
    }

    /** Mantiene completed_at coherente con el estado sin exponerlo al cliente. */
    private function payload(array $validated): array
    {
        return [...$validated, 'completed_at' => $validated['status'] === 'completed' ? now() : null];
    }
}
